// ============================================
// RESPONSIVE DEMO - TypeScript Application
// Demonstrates breakpoint detection and responsive JavaScript
// ============================================

/**
 * Breakpoint configuration interface
 * Defines all responsive breakpoints matching SCSS
 */
interface Breakpoints {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
}

/**
 * Breakpoint name type - ensures type safety
 */
type BreakpointName = keyof Breakpoints;

/**
 * Viewport change event detail interface
 */
interface ViewportChangeDetail {
    oldBreakpoint: BreakpointName;
    newBreakpoint: BreakpointName;
    width: number;
    height: number;
}

/**
 * Device information interface
 */
interface DeviceInfo {
    type: 'mobile' | 'tablet' | 'desktop';
    orientation: 'portrait' | 'landscape';
    isTouch: boolean;
    pixelRatio: number;
}

// ============================================
// BREAKPOINT MANAGER CLASS
// Detects and manages responsive breakpoints
// ============================================

class BreakpointManager {
    // Breakpoint definitions (must match SCSS)
    private breakpoints: Breakpoints = {
        xs: 0,
        sm: 576,
        md: 768,
        lg: 1024,
        xl: 1280,
        xxl: 1536
    };
    
    private currentBreakpoint: BreakpointName;
    private previousBreakpoint: BreakpointName | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private callbacks: {
        change: ((data: ViewportChangeDetail) => void)[];
        enter: Record<string, (() => void)[]>;
        exit: Record<string, (() => void)[]>;
    };
    
    constructor() {
        this.currentBreakpoint = this.getCurrentBreakpoint();
        this.callbacks = {
            change: [],
            enter: {},
            exit: {}
        };
        this.init();
    }
    
    /**
     * Initialize breakpoint detection
     * Uses ResizeObserver for better performance than resize event
     */
    private init(): void {
        // Create ResizeObserver to watch for viewport changes
        this.resizeObserver = new ResizeObserver(
            this.debounce(() => {
                this.checkBreakpointChange();
            }, 100)
        );
        
        // Observe body element for size changes
        this.resizeObserver.observe(document.body);
        
        console.log(`[BreakpointManager] Initialized at breakpoint: ${this.currentBreakpoint}`);
    }
    
    /**
     * Get current breakpoint based on window width
     */
    private getCurrentBreakpoint(): BreakpointName {
        const width = window.innerWidth;
        let current: BreakpointName = 'xs';
        
        // Find the largest breakpoint that window width exceeds
        (Object.entries(this.breakpoints) as [BreakpointName, number][]).forEach(
            ([name, minWidth]) => {
                if (width >= minWidth) {
                    current = name;
                }
            }
        );
        
        return current;
    }
    
    /**
     * Check if breakpoint has changed and trigger callbacks
     */
    private checkBreakpointChange(): void {
        const newBreakpoint = this.getCurrentBreakpoint();
        
        if (newBreakpoint !== this.currentBreakpoint) {
            this.previousBreakpoint = this.currentBreakpoint;
            this.currentBreakpoint = newBreakpoint;
            
            const detail: ViewportChangeDetail = {
                oldBreakpoint: this.previousBreakpoint,
                newBreakpoint: this.currentBreakpoint,
                width: window.innerWidth,
                height: window.innerHeight
            };
            
            // Trigger change callbacks
            this.callbacks.change.forEach(callback => callback(detail));
            
            // Trigger exit callbacks for old breakpoint
            if (this.previousBreakpoint && this.callbacks.exit[this.previousBreakpoint]) {
                this.callbacks.exit[this.previousBreakpoint].forEach(cb => cb());
            }
            
            // Trigger enter callbacks for new breakpoint
            if (this.callbacks.enter[this.currentBreakpoint]) {
                this.callbacks.enter[this.currentBreakpoint].forEach(cb => cb());
            }
            
            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('breakpointChange', { detail }));
            
            console.log(`[BreakpointManager] Breakpoint changed: ${this.previousBreakpoint} → ${this.currentBreakpoint}`);
        }
    }
    
    /**
     * Register callback for any breakpoint change
     */
    public onChange(callback: (data: ViewportChangeDetail) => void): this {
        this.callbacks.change.push(callback);
        return this; // Allow chaining
    }
    
    /**
     * Register callback for entering specific breakpoint
     */
    public onEnter(breakpoint: BreakpointName, callback: () => void): this {
        if (!this.callbacks.enter[breakpoint]) {
            this.callbacks.enter[breakpoint] = [];
        }
        this.callbacks.enter[breakpoint].push(callback);
        return this;
    }
    
    /**
     * Register callback for exiting specific breakpoint
     */
    public onExit(breakpoint: BreakpointName, callback: () => void): this {
        if (!this.callbacks.exit[breakpoint]) {
            this.callbacks.exit[breakpoint] = [];
        }
        this.callbacks.exit[breakpoint].push(callback);
        return this;
    }
    
    /**
     * Check if current breakpoint matches
     */
    public is(breakpoint: BreakpointName): boolean {
        return this.currentBreakpoint === breakpoint;
    }
    
    /**
     * Check if current breakpoint is equal or larger than target
     */
    public isUp(breakpoint: BreakpointName): boolean {
        const breakpointNames = Object.keys(this.breakpoints) as BreakpointName[];
        const currentIndex = breakpointNames.indexOf(this.currentBreakpoint);
        const targetIndex = breakpointNames.indexOf(breakpoint);
        return currentIndex >= targetIndex;
    }
    
    /**
     * Check if current breakpoint is equal or smaller than target
     */
    public isDown(breakpoint: BreakpointName): boolean {
        const breakpointNames = Object.keys(this.breakpoints) as BreakpointName[];
        const currentIndex = breakpointNames.indexOf(this.currentBreakpoint);
        const targetIndex = breakpointNames.indexOf(breakpoint);
        return currentIndex <= targetIndex;
    }
    
    /**
     * Get current breakpoint name
     */
    public get(): BreakpointName {
        return this.currentBreakpoint;
    }
    
    /**
     * Get viewport dimensions
     */
    public getViewport(): { width: number; height: number } {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
    
    /**
     * Debounce utility function
     */
    private debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: number | null = null;
        
        return (...args: Parameters<T>) => {
            if (timeout) clearTimeout(timeout);
            timeout = window.setTimeout(() => func(...args), wait) as any;
        };
    }
    
    /**
     * Cleanup - disconnect observer
     */
    public destroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.callbacks = { change: [], enter: {}, exit: {} };
    }
}

// ============================================
// RESPONSIVE NAVIGATION CLASS
// Handles mobile hamburger menu
// ============================================

class ResponsiveNav {
    private nav: HTMLElement;
    private toggle: HTMLElement;
    private menu: HTMLElement;
    private isOpen: boolean = false;
    private isMobile: boolean;
    private mobileBreakpoint: number = 768;
    
    constructor(navSelector: string) {
        const nav = document.querySelector(navSelector);
        if (!nav) {
            console.error(`[ResponsiveNav] Navigation element "${navSelector}" not found`);
            return;
        }
        
        this.nav = nav as HTMLElement;
        this.toggle = this.nav.querySelector('.nav-toggle') as HTMLElement;
        this.menu = this.nav.querySelector('.nav-menu') as HTMLElement;
        this.isMobile = window.innerWidth < this.mobileBreakpoint;
        
        if (!this.toggle || !this.menu) {
            console.error('[ResponsiveNav] Toggle button or menu not found');
            return;
        }
        
        this.init();
    }
    
    /**
     * Initialize navigation event listeners
     */
    private init(): void {
        // Toggle button click
        this.toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });
        
        // Window resize
        window.addEventListener('resize', this.debounce(() => {
            this.checkViewport();
        }, 250));
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.nav.contains(e.target as Node)) {
                this.closeMenu();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
                this.toggle.focus();
            }
        });
        
        // Close on link click (mobile only)
        const links = this.menu.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                if (this.isMobile && this.isOpen) {
                    this.closeMenu();
                }
            });
        });
        
        console.log('[ResponsiveNav] Initialized');
    }
    
    /**
     * Check viewport size and update mobile state
     */
    private checkViewport(): void {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth < this.mobileBreakpoint;
        
        // Close menu when switching from mobile to desktop
        if (wasMobile && !this.isMobile && this.isOpen) {
            this.closeMenu();
        }
    }
    
    /**
     * Toggle menu open/closed
     */
    private toggleMenu(): void {
        this.isOpen ? this.closeMenu() : this.openMenu();
    }
    
    /**
     * Open mobile menu
     */
    private openMenu(): void {
        this.menu.classList.add('is-open');
        this.toggle.classList.add('is-active');
        this.toggle.setAttribute('aria-expanded', 'true');
        this.isOpen = true;
        
        // Lock body scroll on mobile
        if (this.isMobile) {
            document.body.style.overflow = 'hidden';
        }
        
        console.log('[ResponsiveNav] Menu opened');
    }
    
    /**
     * Close mobile menu
     */
    private closeMenu(): void {
        this.menu.classList.remove('is-open');
        this.toggle.classList.remove('is-active');
        this.toggle.setAttribute('aria-expanded', 'false');
        this.isOpen = false;
        
        // Unlock body scroll
        document.body.style.overflow = '';
        
        console.log('[ResponsiveNav] Menu closed');
    }
    
    /**
     * Debounce utility
     */
    private debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: number | null = null;
        return (...args: Parameters<T>) => {
            if (timeout) clearTimeout(timeout);
            timeout = window.setTimeout(() => func(...args), wait);
        };
    }
}

// ============================================
// DEVICE DETECTOR CLASS
// Detects device type, orientation, touch capability
// ============================================

class DeviceDetector {
    /**
     * Get comprehensive device information
     */
    public static getDeviceInfo(): DeviceInfo {
        const width = window.innerWidth;
        let type: DeviceInfo['type'] = 'desktop';
        
        // Determine device type based on width
        if (width < 768) {
            type = 'mobile';
        } else if (width < 1024) {
            type = 'tablet';
        }
        
        return {
            type,
            orientation: this.getOrientation(),
            isTouch: this.isTouchDevice(),
            pixelRatio: window.devicePixelRatio || 1
        };
    }
    
    /**
     * Get device orientation
     */
    public static getOrientation(): 'portrait' | 'landscape' {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }
    
    /**
     * Check if device supports touch
     */
    public static isTouchDevice(): boolean {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            // @ts-ignore - msMaxTouchPoints is legacy IE
            navigator.msMaxTouchPoints > 0
        );
    }
    
    /**
     * Check if device is mobile
     */
    public static isMobile(): boolean {
        return window.innerWidth < 768;
    }
    
    /**
     * Check if device is tablet
     */
    public static isTablet(): boolean {
        const width = window.innerWidth;
        return width >= 768 && width < 1024;
    }
    
    /**
     * Check if device is desktop
     */
    public static isDesktop(): boolean {
        return window.innerWidth >= 1024;
    }
}

// ============================================
// UI UPDATE CLASS
// Updates UI elements with current breakpoint info
// ============================================

class UIUpdater {
    private currentBreakpointEl: HTMLElement | null;
    private viewportDimensionsEl: HTMLElement | null;
    private deviceTypeEl: HTMLElement | null;
    private orientationEl: HTMLElement | null;
    private viewportSizeEl: HTMLElement | null;
    private touchDeviceEl: HTMLElement | null;
    private breakpointLogEl: HTMLElement | null;
    
    constructor() {
        // Get all UI elements
        this.currentBreakpointEl = document.getElementById('current-breakpoint');
        this.viewportDimensionsEl = document.getElementById('viewport-dimensions');
        this.deviceTypeEl = document.getElementById('device-type');
        this.orientationEl = document.getElementById('orientation');
        this.viewportSizeEl = document.getElementById('viewport-size');
        this.touchDeviceEl = document.getElementById('touch-device');
        this.breakpointLogEl = document.getElementById('breakpoint-log');
    }
    
    /**
     * Update breakpoint indicator
     */
    public updateBreakpoint(breakpoint: BreakpointName): void {
        if (this.currentBreakpointEl) {
            this.currentBreakpointEl.textContent = breakpoint.toUpperCase();
        }
    }
    
    /**
     * Update viewport dimensions display
     */
    public updateViewportDimensions(width: number, height: number): void {
        if (this.viewportDimensionsEl) {
            this.viewportDimensionsEl.textContent = `${width}×${height}`;
        }
        
        if (this.viewportSizeEl) {
            this.viewportSizeEl.textContent = `${width} × ${height}`;
        }
    }
    
    /**
     * Update device information display
     */
    public updateDeviceInfo(info: DeviceInfo): void {
        if (this.deviceTypeEl) {
            this.deviceTypeEl.textContent = this.capitalize(info.type);
        }
        
        if (this.orientationEl) {
            this.orientationEl.textContent = this.capitalize(info.orientation);
        }
        
        if (this.touchDeviceEl) {
            this.touchDeviceEl.textContent = info.isTouch ? 'Yes' : 'No';
        }
    }
    
    /**
     * Add entry to breakpoint change log
     */
    public addLogEntry(oldBreakpoint: BreakpointName, newBreakpoint: BreakpointName): void {
        if (!this.breakpointLogEl) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('li');
        entry.textContent = `${timestamp} - Changed from ${oldBreakpoint.toUpperCase()} to ${newBreakpoint.toUpperCase()}`;
        
        // Add to top of list
        this.breakpointLogEl.insertBefore(entry, this.breakpointLogEl.firstChild);
        
        // Keep only last 10 entries
        while (this.breakpointLogEl.children.length > 10) {
            this.breakpointLogEl.removeChild(this.breakpointLogEl.lastChild!);
        }
    }
    
    /**
     * Capitalize first letter
     */
    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// ============================================
// APPLICATION INITIALIZATION
// ============================================

/**
 * Main application class
 */
class ResponsiveApp {
    private breakpointManager: BreakpointManager;
    private navigation: ResponsiveNav;
    private uiUpdater: UIUpdater;
    
    constructor() {
        console.log('[ResponsiveApp] Initializing...');
        
        // Initialize components
        this.breakpointManager = new BreakpointManager();
        this.navigation = new ResponsiveNav('.nav');
        this.uiUpdater = new UIUpdater();
        
        // Set initial UI state
        this.updateUI();
        
        // Register breakpoint change listener
        this.breakpointManager.onChange((data) => {
            this.handleBreakpointChange(data);
        });
        
        // Register orientation change listener
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.updateUI(), 100);
        });
        
        // Update UI on resize (debounced)
        window.addEventListener('resize', this.debounce(() => {
            this.updateUI();
        }, 250));
        
        console.log('[ResponsiveApp] Initialized successfully');
        console.log(`Current breakpoint: ${this.breakpointManager.get()}`);
        console.log(`Device: ${DeviceDetector.getDeviceInfo().type}`);
    }
    
    /**
     * Handle breakpoint change
     */
    private handleBreakpointChange(data: ViewportChangeDetail): void {
        console.log('[ResponsiveApp] Breakpoint changed:', data);
        
        // Update UI
        this.updateUI();
        
        // Add to log
        this.uiUpdater.addLogEntry(data.oldBreakpoint, data.newBreakpoint);
        
        // Custom logic for specific breakpoints
        if (data.newBreakpoint === 'lg' || data.newBreakpoint === 'xl') {
            console.log('[ResponsiveApp] Desktop view - loading desktop features');
        } else if (data.newBreakpoint === 'xs' || data.newBreakpoint === 'sm') {
            console.log('[ResponsiveApp] Mobile view - loading mobile features');
        }
    }
    
    /**
     * Update all UI elements
     */
    private updateUI(): void {
        const breakpoint = this.breakpointManager.get();
        const viewport = this.breakpointManager.getViewport();
        const deviceInfo = DeviceDetector.getDeviceInfo();
        
        // Update UI elements
        this.uiUpdater.updateBreakpoint(breakpoint);
        this.uiUpdater.updateViewportDimensions(viewport.width, viewport.height);
        this.uiUpdater.updateDeviceInfo(deviceInfo);
    }
    
    /**
     * Debounce utility
     */
    private debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: number | null = null;
        return (...args: Parameters<T>) => {
            if (timeout) clearTimeout(timeout);
            timeout = window.setTimeout(() => func(...args), wait);
        };
    }
}

// ============================================
// INITIALIZE ON DOM READY
// ============================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ResponsiveApp();
    });
} else {
    // DOM is already loaded
    new ResponsiveApp();
}

// Export for use in other modules (if needed)
export { BreakpointManager, ResponsiveNav, DeviceDetector, ResponsiveApp };
