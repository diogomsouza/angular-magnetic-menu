import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  booleanAttribute,
  numberAttribute,
} from '@angular/core';
import { isPlatformBrowser, NgClass, NgFor, NgIf, NgStyle } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import {
  MagneticMenuDragEvent,
  MagneticMenuInput,
  MagneticMenuItem,
  MagneticMenuItemEvent,
  MagneticMenuItemUpdate,
  MagneticMenuRouterLink,
  MagneticMenuSection,
  MagneticMenuSide,
  MagneticMenuTheme,
} from './magnetic-menu.models';

const DEFAULT_SECTION_ID = 'default';
const FRAME_FALLBACK_MS = 16;

@Component({
  selector: 'stagyra-magnetic-menu',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, NgStyle],
  templateUrl: './angular-magnetic-menu.component.html',
  styleUrl: './angular-magnetic-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StagyraMagneticMenuComponent implements OnInit, OnChanges, OnDestroy {
  @Input() set items(value: MagneticMenuInput | null | undefined) {
    this.sections = this.normalizeInput(value);
  }

  @Input({ transform: booleanAttribute }) opened = true;
  @Input() side: MagneticMenuSide = 'left';
  @Input() theme: MagneticMenuTheme = 'light';
  @Input({ transform: numberAttribute }) openedSize = 300;
  @Input({ transform: numberAttribute }) closedSize = 6;
  @Input({ transform: numberAttribute }) handleSize = 28;
  @Input({ transform: numberAttribute }) handleInset = 5;
  @Input({ transform: numberAttribute }) contentPlaneOverlap = 18;
  @Input({ transform: booleanAttribute }) dragEnabled = true;
  @Input({ transform: booleanAttribute }) clickToToggle = true;
  @Input({ transform: booleanAttribute }) closeOnItemClick = false;
  @Input({ transform: numberAttribute }) positionThreshold = 0.48;
  @Input({ transform: numberAttribute }) velocityThreshold = 0.42;
  @Input({ transform: numberAttribute }) snapAnimationMs = 440;
  @Input() activeItemId: string | null | undefined;
  @Input() handleOpenAriaLabel = 'Open menu';
  @Input() handleCloseAriaLabel = 'Close menu';

  @Output() readonly openedChange = new EventEmitter<boolean>();
  @Output() readonly itemClick = new EventEmitter<MagneticMenuItemEvent>();
  @Output() readonly activeItemChange = new EventEmitter<string | null>();
  @Output() readonly dragStart = new EventEmitter<MagneticMenuDragEvent>();
  @Output() readonly dragEnd = new EventEmitter<MagneticMenuDragEvent>();

  @ViewChild('handle', { static: true }) private handleRef?: ElementRef<HTMLElement>;

  @HostBinding('class.stagyra-magnetic-menu-host') readonly hostClass = true;

  sections: MagneticMenuSection[] = [];
  progress = 1;
  private internalActiveItemId: string | null = null;
  private isBrowser: boolean;
  private routerSub?: Subscription;
  private removePointerMove?: () => void;
  private removePointerUp?: () => void;
  private animationFrameId: number | null = null;
  private suppressNextHandleClick = false;
  private dragState: {
    pointerId: number;
    startClientX: number;
    startSize: number;
    lastClientX: number;
    lastTime: number;
    velocity: number;
    hasDragged: boolean;
  } | null = null;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly zone: NgZone,
    @Inject(PLATFORM_ID) platformId: object,
    @Optional()
    private readonly router: Router | null,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.progress = this.opened ? 1 : 0;

    if (this.router) {
      this.routerSub = this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          this.emitRouterActiveItem();
          this.cdr.markForCheck();
        });
      this.emitRouterActiveItem();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['opened'] && !changes['opened'].firstChange && !this.dragState) {
      this.animateTo(this.opened ? 1 : 0, false);
    }

    if (changes['openedSize'] || changes['closedSize']) {
      this.progress = this.clampProgress(this.progress);
    }

    if (changes['activeItemId'] && this.activeItemId !== undefined) {
      this.emitActiveItem(this.activeItemId);
    }
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.teardownPointerListeners();
    this.cancelAnimation();
  }

  open(): void {
    this.setOpened(true);
  }

  close(): void {
    this.setOpened(false);
  }

  toggle(): void {
    this.setOpened(!this.opened);
  }

  setItems(items: MagneticMenuInput | null | undefined): void {
    this.sections = this.normalizeInput(items);
    this.cdr.markForCheck();
  }

  addItem(item: MagneticMenuItem, sectionId = DEFAULT_SECTION_ID): void {
    const normalizedItem = this.normalizeItem(item);
    const sections = this.cloneSections();
    let section = sections.find((candidate) => candidate.id === sectionId);

    if (!section) {
      section = { id: sectionId, items: [] };
      sections.push(section);
    }

    section.items = [...section.items, normalizedItem];
    this.sections = sections;
    this.cdr.markForCheck();
  }

  updateItem(itemId: string, patch: MagneticMenuItemUpdate): void {
    this.sections = this.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => (
        item.id === itemId ? this.normalizeItem({ ...item, ...patch, id: item.id }) : item
      )),
    }));
    this.cdr.markForCheck();
  }

  removeItem(itemId: string): void {
    this.sections = this.sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.id !== itemId),
      }))
      .filter((section) => section.id !== DEFAULT_SECTION_ID || section.items.length > 0);
    this.cdr.markForCheck();
  }

  hideItem(itemId: string): void {
    this.updateItem(itemId, { visible: false });
  }

  showItem(itemId: string): void {
    this.updateItem(itemId, { visible: true });
  }

  clearItems(): void {
    this.sections = [];
    this.cdr.markForCheck();
  }

  onHandlePointerDown(event: PointerEvent): void {
    if (!this.dragEnabled || !this.isBrowser || event.button !== 0) {
      return;
    }

    event.preventDefault();
    this.cancelAnimation();

    const now = this.now();
    this.dragState = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startSize: this.currentSize,
      lastClientX: event.clientX,
      lastTime: now,
      velocity: 0,
      hasDragged: false,
    };

    this.handleRef?.nativeElement.setPointerCapture?.(event.pointerId);
    this.dragStart.emit(this.createDragEvent());

    this.zone.runOutsideAngular(() => {
      const move = (moveEvent: PointerEvent) => this.onDocumentPointerMove(moveEvent);
      const up = (upEvent: PointerEvent) => this.onDocumentPointerUp(upEvent);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      this.removePointerMove = () => window.removeEventListener('pointermove', move);
      this.removePointerUp = () => {
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      };
    });
  }

  onHandleClick(): void {
    if (this.suppressNextHandleClick) {
      this.suppressNextHandleClick = false;
      return;
    }

    if (this.clickToToggle && !this.dragState) {
      this.toggle();
    }
  }

  onHandleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (!this.clickToToggle) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
    }
  }

  onItemClick(item: MagneticMenuItem, section: MagneticMenuSection, event: MouseEvent): void {
    if (item.disabled) {
      event.preventDefault();
      return;
    }

    this.itemClick.emit({ item, section });

    if (item.routerLink && this.router) {
      event.preventDefault();
      this.navigate(item.routerLink, item);
    } else {
      this.setInternalActiveItem(item.id);
    }

    if (this.closeOnItemClick) {
      this.close();
    }
  }

  onItemKeydown(item: MagneticMenuItem, section: MagneticMenuSection, event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onItemClick(item, section, event as unknown as MouseEvent);
  }

  visibleSections(): MagneticMenuSection[] {
    return this.sections
      .filter((section) => section.visible !== false)
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.visible !== false),
      }))
      .filter((section) => section.items.length > 0);
  }

  isItemActive(item: MagneticMenuItem): boolean {
    if (this.activeItemId !== undefined) {
      return this.activeItemId === item.id;
    }

    if (this.internalActiveItemId === item.id) {
      return true;
    }

    return this.isRouterActive(item);
  }

  trackSection(_: number, section: MagneticMenuSection): string {
    return section.id;
  }

  trackItem(_: number, item: MagneticMenuItem): string {
    return item.id;
  }

  get shellClass(): Record<string, boolean> {
    return {
      'stagyra-magnetic-menu--right': this.side === 'right',
      'stagyra-magnetic-menu--dragging': !!this.dragState,
      'stagyra-magnetic-menu--closed': !this.opened,
      'stagyra-magnetic-menu--open': this.opened,
      'stagyra-magnetic-menu--theme-light': this.theme === 'light',
      'stagyra-magnetic-menu--theme-dark': this.theme === 'dark',
      'stagyra-magnetic-menu--theme-auto': this.theme === 'auto',
    };
  }

  get hostStyles(): Record<string, string> {
    return {
      '--stagyra-magnetic-menu-opened-size': `${this.openedSize}px`,
      '--stagyra-magnetic-menu-closed-size': `${this.closedSize}px`,
      '--stagyra-magnetic-menu-handle-size': `${this.handleSize}px`,
      '--stagyra-magnetic-menu-handle-inset': `${this.handleInset}px`,
      '--stagyra-magnetic-menu-current-size': `${this.currentSize}px`,
      '--stagyra-magnetic-menu-current-overlap': `${this.currentOverlap}px`,
      '--stagyra-magnetic-menu-progress': `${this.progress}`,
      '--stagyra-magnetic-menu-body-opacity': `${this.bodyOpacity}`,
    };
  }

  get currentSize(): number {
    return this.closedSize + ((this.openedSize - this.closedSize) * this.progress);
  }

  get currentOverlap(): number {
    return Math.max(0, Math.min(this.contentPlaneOverlap, this.currentSize - this.closedSize)) * this.progress;
  }

  get bodyAriaHidden(): boolean {
    return this.progress < 0.08;
  }

  get itemTabIndex(): number {
    return this.opened ? 0 : -1;
  }

  get handleAriaLabel(): string {
    return this.opened ? this.handleCloseAriaLabel : this.handleOpenAriaLabel;
  }

  private onDocumentPointerMove(event: PointerEvent): void {
    const state = this.dragState;
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    event.preventDefault();

    const now = this.now();
    const elapsed = Math.max(now - state.lastTime, FRAME_FALLBACK_MS);
    const directionalDelta = this.directionalDelta(event.clientX - state.startClientX);
    const nextSize = this.clampSize(state.startSize + directionalDelta);
    const moveDelta = this.directionalDelta(event.clientX - state.lastClientX);

    state.hasDragged ||= Math.abs(event.clientX - state.startClientX) > 4;
    state.velocity = moveDelta / elapsed;
    state.lastClientX = event.clientX;
    state.lastTime = now;

    this.zone.run(() => {
      this.progress = this.sizeToProgress(nextSize);
      this.cdr.markForCheck();
    });
  }

  private onDocumentPointerUp(event: PointerEvent): void {
    const state = this.dragState;
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    event.preventDefault();
    this.handleRef?.nativeElement.releasePointerCapture?.(event.pointerId);
    this.teardownPointerListeners();

    const shouldOpen = this.resolveOpenState(state.velocity);
    this.suppressNextHandleClick = state.hasDragged;
    this.dragState = null;

    this.zone.run(() => {
      this.dragEnd.emit(this.createDragEvent(shouldOpen));
      this.setOpened(shouldOpen);
    });
  }

  private resolveOpenState(velocity: number): boolean {
    const velocityThreshold = Math.max(0, this.velocityThreshold);
    if (velocity > velocityThreshold) {
      return true;
    }

    if (velocity < -velocityThreshold) {
      return false;
    }

    return this.progress >= this.clampProgress(this.positionThreshold);
  }

  private setOpened(opened: boolean): void {
    if (this.opened !== opened) {
      this.opened = opened;
      this.openedChange.emit(opened);
    }

    this.animateTo(opened ? 1 : 0, true);
  }

  private animateTo(targetProgress: number, emitMark: boolean): void {
    this.cancelAnimation();
    const target = this.clampProgress(targetProgress);

    if (!this.isBrowser || this.snapAnimationMs <= 0) {
      this.progress = target;
      this.cdr.markForCheck();
      return;
    }

    const start = this.progress;
    const distance = target - start;
    const duration = Math.max(80, this.snapAnimationMs);
    const startTime = this.now();

    this.zone.runOutsideAngular(() => {
      const tick = () => {
        const elapsed = this.now() - startTime;
        const amount = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - amount, 3);
        this.progress = this.clampProgress(start + (distance * eased));

        this.zone.run(() => this.cdr.markForCheck());

        if (amount < 1) {
          this.animationFrameId = window.requestAnimationFrame(tick);
        } else {
          this.animationFrameId = null;
          this.progress = target;
          if (emitMark) {
            this.zone.run(() => this.cdr.markForCheck());
          }
        }
      };

      this.animationFrameId = window.requestAnimationFrame(tick);
    });
  }

  private navigate(routerLink: MagneticMenuRouterLink, item: MagneticMenuItem): void {
    if (!this.router) {
      return;
    }

    const commands = typeof routerLink === 'string' ? [routerLink] : [...routerLink];
    void this.router.navigate(commands, item.routerExtras);
  }

  private isRouterActive(item: MagneticMenuItem): boolean {
    if (!this.router || !item.routerLink) {
      return false;
    }

    try {
      const tree = typeof item.routerLink === 'string'
        ? this.router.parseUrl(item.routerLink)
        : this.router.createUrlTree([...item.routerLink]);

      return this.router.isActive(tree, {
        paths: item.exact ? 'exact' : 'subset',
        queryParams: item.exact ? 'exact' : 'subset',
        fragment: 'ignored',
        matrixParams: 'ignored',
      });
    } catch {
      return false;
    }
  }

  private emitRouterActiveItem(): void {
    if (this.activeItemId !== undefined) {
      return;
    }

    const activeItem = this.sections
      .flatMap((section) => section.items)
      .find((item) => this.isRouterActive(item));

    if (activeItem && activeItem.id !== this.internalActiveItemId) {
      this.internalActiveItemId = activeItem.id;
      this.activeItemChange.emit(activeItem.id);
    }
  }

  private setInternalActiveItem(itemId: string): void {
    if (this.activeItemId !== undefined) {
      this.activeItemChange.emit(itemId);
      return;
    }

    this.internalActiveItemId = itemId;
    this.activeItemChange.emit(itemId);
    this.cdr.markForCheck();
  }

  private emitActiveItem(itemId: string | null | undefined): void {
    this.activeItemChange.emit(itemId ?? null);
  }

  private normalizeInput(input: MagneticMenuInput | null | undefined): MagneticMenuSection[] {
    if (!input) {
      return [];
    }

    if (!Array.isArray(input) && Array.isArray(input.sections)) {
      return input.sections.map((section) => this.normalizeSection(section));
    }

    if (Array.isArray(input) && input.every((entry) => this.isSection(entry))) {
      return input.map((section) => this.normalizeSection(section as MagneticMenuSection));
    }

    if (Array.isArray(input)) {
      return [{
        id: DEFAULT_SECTION_ID,
        items: input.map((item) => this.normalizeItem(item as MagneticMenuItem)),
      }];
    }

    return [];
  }

  private normalizeSection(section: MagneticMenuSection): MagneticMenuSection {
    return {
      ...section,
      id: section.id,
      visible: section.visible ?? true,
      items: (section.items ?? []).map((item) => this.normalizeItem(item)),
    };
  }

  private normalizeItem(item: MagneticMenuItem): MagneticMenuItem {
    return {
      ...item,
      visible: item.visible ?? true,
      disabled: item.disabled ?? false,
      exact: item.exact ?? false,
    };
  }

  private isSection(value: MagneticMenuSection | MagneticMenuItem): value is MagneticMenuSection {
    return Array.isArray((value as MagneticMenuSection).items);
  }

  private cloneSections(): MagneticMenuSection[] {
    return this.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item })),
    }));
  }

  private createDragEvent(opened = this.opened): MagneticMenuDragEvent {
    return {
      progress: this.progress,
      size: this.currentSize,
      opened,
    };
  }

  private directionalDelta(delta: number): number {
    return this.side === 'left' ? delta : -delta;
  }

  private sizeToProgress(size: number): number {
    const range = this.openedSize - this.closedSize;
    if (range <= 0) {
      return 1;
    }

    return this.clampProgress((size - this.closedSize) / range);
  }

  private clampSize(size: number): number {
    return Math.min(Math.max(size, this.closedSize), this.openedSize);
  }

  private clampProgress(value: number): number {
    return Math.min(Math.max(value, 0), 1);
  }

  private get bodyOpacity(): number {
    if (this.progress <= 0.12) {
      return 0;
    }

    return Math.min(1, (this.progress - 0.12) / 0.42);
  }

  private now(): number {
    if (this.isBrowser && window.performance) {
      return window.performance.now();
    }

    return Date.now();
  }

  private cancelAnimation(): void {
    if (this.animationFrameId !== null && this.isBrowser) {
      window.cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = null;
  }

  private teardownPointerListeners(): void {
    this.removePointerMove?.();
    this.removePointerUp?.();
    this.removePointerMove = undefined;
    this.removePointerUp = undefined;
  }
}
