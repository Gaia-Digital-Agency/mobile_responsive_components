// ============================================
// RESPONSIVE DEMO - TypeScript Application
// Demonstrates breakpoint detection and responsive JavaScript
// ============================================
// ============================================
// BREAKPOINT MANAGER CLASS
// Detects and manages responsive breakpoints
// ============================================
class BreakpointManager {
    constructor() {
        // Breakpoint definitions (must match SCSS)
        this.breakpoints = {
            xs: 0,
            sm: 576,
            md: 768,
            lg: 1024,
            xl: 1280,
            xxl: 1536
        };
        this.previousBreakpoint = null;
        this.resizeObserver = null;
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
    init() {
        // Create ResizeObserver to watch for viewport changes
        this.resizeObserver = new ResizeObserver(this.debounce(() => {
            this.checkBreakpointChange();
        }, 100));
        // Observe body element for size changes
        this.resizeObserver.observe(document.body);
        console.log(`[BreakpointManager] Initialized at breakpoint: ${this.currentBreakpoint}`);
    }
    /**
     * Get current breakpoint based on window width
     */
    getCurrentBreakpoint() {
        const width = window.innerWidth;
        let current = 'xs';
        // Find the largest breakpoint that window width exceeds
        Object.entries(this.breakpoints).forEach(([name, minWidth]) => {
            if (width >= minWidth) {
                current = name;
            }
        });
        return current;
    }
    /**
     * Check if breakpoint has changed and trigger callbacks
     */
    checkBreakpointChange() {
        const newBreakpoint = this.getCurrentBreakpoint();
        if (newBreakpoint !== this.currentBreakpoint) {
            this.previousBreakpoint = this.currentBreakpoint;
            this.currentBreakpoint = newBreakpoint;
            const detail = {
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
    onChange(callback) {
        this.callbacks.change.push(callback);
        return this; // Allow chaining
    }
    /**
     * Register callback for entering specific breakpoint
     */
    onEnter(breakpoint, callback) {
        if (!this.callbacks.enter[breakpoint]) {
            this.callbacks.enter[breakpoint] = [];
        }
        this.callbacks.enter[breakpoint].push(callback);
        return this;
    }
    /**
     * Register callback for exiting specific breakpoint
     */
    onExit(breakpoint, callback) {
        if (!this.callbacks.exit[breakpoint]) {
            this.callbacks.exit[breakpoint] = [];
        }
        this.callbacks.exit[breakpoint].push(callback);
        return this;
    }
    /**
     * Check if current breakpoint matches
     */
    is(breakpoint) {
        return this.currentBreakpoint === breakpoint;
    }
    /**
     * Check if current breakpoint is equal or larger than target
     */
    isUp(breakpoint) {
        const breakpointNames = Object.keys(this.breakpoints);
        const currentIndex = breakpointNames.indexOf(this.currentBreakpoint);
        const targetIndex = breakpointNames.indexOf(breakpoint);
        return currentIndex >= targetIndex;
    }
    /**
     * Check if current breakpoint is equal or smaller than target
     */
    isDown(breakpoint) {
        const breakpointNames = Object.keys(this.breakpoints);
        const currentIndex = breakpointNames.indexOf(this.currentBreakpoint);
        const targetIndex = breakpointNames.indexOf(breakpoint);
        return currentIndex <= targetIndex;
    }
    /**
     * Get current breakpoint name
     */
    get() {
        return this.currentBreakpoint;
    }
    /**
     * Get viewport dimensions
     */
    getViewport() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout = null;
        return (...args) => {
            if (timeout)
                clearTimeout(timeout);
            timeout = window.setTimeout(() => func(...args), wait);
        };
    }
    /**
     * Cleanup - disconnect observer
     */
    destroy() {
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
    constructor(navSelector) {
        this.isOpen = false;
        this.mobileBreakpoint = 768;
        const nav = document.querySelector(navSelector);
        if (!nav) {
            console.error(`[ResponsiveNav] Navigation element "${navSelector}" not found`);
            return;
        }
        this.nav = nav;
        this.toggle = this.nav.querySelector('.nav-toggle');
        this.menu = this.nav.querySelector('.nav-menu');
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
    init() {
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
            if (this.isOpen && !this.nav.contains(e.target)) {
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
    checkViewport() {
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
    toggleMenu() {
        this.isOpen ? this.closeMenu() : this.openMenu();
    }
    /**
     * Open mobile menu
     */
    openMenu() {
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
    closeMenu() {
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
    debounce(func, wait) {
        let timeout = null;
        return (...args) => {
            if (timeout)
                clearTimeout(timeout);
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
    static getDeviceInfo() {
        const width = window.innerWidth;
        let type = 'desktop';
        // Determine device type based on width
        if (width < 768) {
            type = 'mobile';
        }
        else if (width < 1024) {
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
    static getOrientation() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }
    /**
     * Check if device supports touch
     */
    static isTouchDevice() {
        return ('ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            // @ts-ignore - msMaxTouchPoints is legacy IE
            navigator.msMaxTouchPoints > 0);
    }
    /**
     * Check if device is mobile
     */
    static isMobile() {
        return window.innerWidth < 768;
    }
    /**
     * Check if device is tablet
     */
    static isTablet() {
        const width = window.innerWidth;
        return width >= 768 && width < 1024;
    }
    /**
     * Check if device is desktop
     */
    static isDesktop() {
        return window.innerWidth >= 1024;
    }
}
// ============================================
// UI UPDATE CLASS
// Updates UI elements with current breakpoint info
// ============================================
class UIUpdater {
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
    updateBreakpoint(breakpoint) {
        if (this.currentBreakpointEl) {
            this.currentBreakpointEl.textContent = breakpoint.toUpperCase();
        }
    }
    /**
     * Update viewport dimensions display
     */
    updateViewportDimensions(width, height) {
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
    updateDeviceInfo(info) {
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
    addLogEntry(oldBreakpoint, newBreakpoint) {
        if (!this.breakpointLogEl)
            return;
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('li');
        entry.textContent = `${timestamp} - Changed from ${oldBreakpoint.toUpperCase()} to ${newBreakpoint.toUpperCase()}`;
        // Add to top of list
        this.breakpointLogEl.insertBefore(entry, this.breakpointLogEl.firstChild);
        // Keep only last 10 entries
        while (this.breakpointLogEl.children.length > 10) {
            this.breakpointLogEl.removeChild(this.breakpointLogEl.lastChild);
        }
    }
    /**
     * Capitalize first letter
     */
    capitalize(str) {
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
    handleBreakpointChange(data) {
        console.log('[ResponsiveApp] Breakpoint changed:', data);
        // Update UI
        this.updateUI();
        // Add to log
        this.uiUpdater.addLogEntry(data.oldBreakpoint, data.newBreakpoint);
        // Custom logic for specific breakpoints
        if (data.newBreakpoint === 'lg' || data.newBreakpoint === 'xl') {
            console.log('[ResponsiveApp] Desktop view - loading desktop features');
        }
        else if (data.newBreakpoint === 'xs' || data.newBreakpoint === 'sm') {
            console.log('[ResponsiveApp] Mobile view - loading mobile features');
        }
    }
    /**
     * Update all UI elements
     */
    updateUI() {
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
    debounce(func, wait) {
        let timeout = null;
        return (...args) => {
            if (timeout)
                clearTimeout(timeout);
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
}
else {
    // DOM is already loaded
    new ResponsiveApp();
}
// Export for use in other modules (if needed)
export { BreakpointManager, ResponsiveNav, DeviceDetector, ResponsiveApp };
