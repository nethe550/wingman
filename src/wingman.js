/**
 * The Wingman virtual DOM window manager.
 * 
 * @author nethe550
 * @license MIT
 */

/**
 * @typedef {{ width: number, height: number, minWidth: number, minHeight: number, draggable: boolean, resizable: boolean, centered: boolean, darkMode: boolean, shadow: 'always' | 'hover' | 'active' | 'none', title: string, debug: boolean, buttons: { min: boolean, max: boolean, exit: boolean } }} WingmanOptions - Options for a window manager.
 */

/**
 * The default options for a new window.
 * 
 * @type {WingmanOptions}
 */
const DEFAULT_WINDOW = {
    width: 700,
    height: 500,
    minWidth: 250,
    minHeight: 250,
    draggable: true,
    resizable: true,
    centered: true,
    darkMode: true,
    shadow: 'always',
    title: 'New window',
    debug: false,
    buttons: {
        min: true,
        max: true,
        exit: true
    }
};

/**
 * The prefix to use when windows log to the console.
 * 
 * @type {string}
 */
const WINGMAN_PREFIX = '[Wingman] ';

/**
 * This version of Wingman.
 * 
 * @type {string}
 */
const VERSION = '1.0.0';

/**
 * The style to use when windows log to the console.
 * 
 * @typedef {{ Prefix: [string], Log: [string], Info: [string], Warn: [string], Error: [string] }} WingmanLogStyle
 * @property {[string]} Prefix - A list of styles for the prefix badge in console.
 * @property {[string]} Log - A list of styles for logs in console.
 * @property {[string]} Info - A list of styles for information in console.
 * @property {[string]} Warn - A list of styles for warnings in console.
 * @property {[string]} Error - A list of styles for errors in console.
 */
const LogStyle = {
    Prefix: [
        'color: rgb(255,255,255)',
        'background-color: rgb(114, 137, 218)',
        'padding: 2px 4px',
        'margin-right: 0.5em',
        'border-radius: 6px',
        'font-family: "Segoe UI", "Open Sans", monospace, sans-serif',
        'font-size: 14px',
        'font-weight: 400'
    ],
    Log: [
        'color: rgb(255,255,255)',
        'background-color: rgb(64,64,64)',
        'padding: 2px 4px',
        'border-radius: 6px',
        'font-family: "Segoe UI", "Open Sans", monospace, sans-serif',
        'font-size: 14px',
        'font-weight: 400'
    ],
    Info: [
        'color: rgb(200,200,200)',
        'background-color: rgb(90,90,90)',
        'padding: 2px 4px',
        'border-radius: 6px',
        'font-family: "Segoe UI", "Open Sans", monospace, sans-serif',
        'font-size: 14px',
        'font-weight: 400',
        'font-style: italic'
    ],
    Warn: [
        'color: rgb(225,225,225)',
        'background-color: rgb(200,100,0)',
        'padding: 2px 4px',
        'border-radius: 6px',
        'font-family: "Segoe UI", "Open Sans", monospace, sans-serif',
        'font-size: 14px',
        'font-weight: 400'
    ],
    Error: [
        'color: rgb(225,225,225)',
        'background-color: rgb(175,64,64)',
        'padding: 2px 4px',
        'border-radius: 6px',
        'font-family: "Segoe UI", "Open Sans", monospace, sans-serif',
        'font-size: 14px',
        'font-weight: 400'
    ]
}

/**
 * The Wingman window manager class.
 * @class
 */
class Wingman {

    /**
     * Creates a new window manager for this instance.
     * @param {HTMLElement | string} window - The root HTML element to bind this window manager to.
     * @param {WingmanOptions} options - The options for this window.
     */
    constructor(window, options=DEFAULT_WINDOW) {
        
        // access config before verification
        if (options['debug'] != null && options['debug']) {
            this.raw(`==< Wingman v. ${VERSION} >==`, [
                'color: rgb(114, 137, 218)',
                'font-size: 2em',
                'font-weight: bold',
                'padding: 4px 8px',
                'border-radius: 6px',
                'font-family: "Segoe UI", "Open Sans", monospace, sans-serif',
            ]);

            this.warn('Debug mode is turned on.');
            console.log('\n');
            this.log('This is a log.');
            this.info('This is an info.');
            this.warn('This is a warning.');
            this.error('This is an error.');

            console.log('\n'.repeat(5));
        }

        /**
         * Used for window dragging.
         * 
         * First two entries are (x,y) of initial mouse pos,
         * and second two entries are (x,y) of new mouse pos.
         * 
         * @type {[number]}
         */
        this.dragPos = [];

        /**
         * Used for window resizing.
         * 
         * Entries are (x,y) of the current mouse pos.
         * 
         * @type {[number]}
         */
        this.resizePos = [];

        /**
         * The dimensions of this window.
         * 
         * The width and height of this window.
         * 
         * @type {{ w: number, h: number }}
         */
        this.dimensions = {
            x: -1,
            y: -1,
            w: -1,
            h: -1
        };

        /**
         * The root HTML element of this window.
         * 
         * @type {HTMLElement}
         */
        this.window = null;

        /**
         * The header HTML element of this window.
         * 
         * Used for controlling this window.
         * 
         * @type {HTMLElement}
         */
        this.header = null;

        /**
         * The options for this window.
         * 
         * See WingmanOptions for more information.
         * 
         * @type {WingmanOptions}
         */
        this.options = {};

        /**
         * The unique UUID of this window.
         * 
         * @type {number}
         */
        this.id = this.generateID();

        // apply options
        this.apply(window, options);

        // initialize this window
        this.init();

        this.info(`Initialized window ${this.id} (#${this.window.id}).`);

    }

    /**
     * Applies settings to this window manager.
     * @param {HTMLElement | string} window - The root HTML element to bind this window manager to.
     * @param {WingmanOptions} options - The options for this window.
     */
    apply(window, options=DEFAULT_WINDOW) {

        if (this.options.debug) this.info('Validating window...');

        // debug
        if (options['debug'] == null || typeof options['debug'] != 'boolean') this.options['debug'] = DEFAULT_WINDOW['debug'];
        else this.options['debug'] = options['debug'];

        // validate window

        // css selector
        if (typeof window === 'string') {

            if (this.options.debug) this.info('Passed a CSS selector as window.');

            this.window = document.querySelector(window);
            if (!this.window) this.error(`Failed to find HTML element for window with the selector ${window}.`);
        }
        // HTMLElement
        else if (HTMLElement.prototype.isPrototypeOf(window)) {
            if (this.options.debug) this.info('Passed an HTML element as window.');
            this.window = window;
        }
        else {
            this.error(`Invalid 'window' parameter. (${window}).`);
            if (this.options.debug) this.info(`Parameter 'window' can be either HTMLElement or a CSS selector.`);
        }

        // validate options
        if (this.options.debug) this.info('Validating window options...');

        // revert to defaults

        // width
        if (!options['width'] || typeof options['width'] != 'number' || options['width'] < 0) {
            this.options['width'] = DEFAULT_WINDOW['width'];
            this.warn(`Option 'width' was not specified / is invalid. Automatically set to default value of '${DEFAULT_WINDOW['width']}'.`);
        }
        else this.options['width'] = options['width'];

        // height
        if (!options['height'] || typeof options['height'] != 'number' || options['height'] < 0) {
            this.options['height'] = DEFAULT_WINDOW['height'];
            this.warn(`Option 'height' was not specified / is invalid. Automatically set to default value of '${DEFAULT_WINDOW['height']}'.`);
        }
        else this.options['height'] = options['height'];

        // min width
        if (!options['minWidth'] || typeof options['minWidth'] != 'number' || options['minWidth'] < 0) {
            this.options['minWidth'] = DEFAULT_WINDOW['minWidth'];
            this.warn(`Option 'minWidth' was not specified / is invalid. Automatically set to default value of '${DEFAULT_WINDOW['minWidth']}'.`);
        }
        else this.options['minWidth'] = options['minWidth'];

        // min height
        if (!options['minHeight'] || typeof options['minHeight'] != 'number' || options['minHeight'] < 0) {
            this.options['minHeight'] = DEFAULT_WINDOW['minHeight'];
            this.warn(`Option 'minHeight' was not specified / is invalid. Automatically set to default value of '${DEFAULT_WINDOW['minHeight']}'.`);
        }
        else this.options['minHeight'] = options['minHeight'];

        // draggable
        if (options['draggable'] == null || typeof options['draggable'] != 'boolean') {
            this.options['draggable'] = DEFAULT_WINDOW['draggable'];
            this.warn(`Option 'draggable' was not specified / invalid. Automatically set to default value of '${DEFAULT_WINDOW['draggable']}'.`);
        }
        else this.options['draggable'] = options['draggable'];

        // resizable
        if (options['resizable'] == null || typeof options['resizable'] != 'boolean') {
            this.options['resizable'] = DEFAULT_WINDOW['resizable'];
            this.warn(`Option 'resizable' was not specified / is invalid. Automatically set to default value of '${DEFAULT_WINDOW['resizable']}'.`);
        }
        else this.options['resizable'] = options['resizable'];

        // centered
        if (options['centered'] == null || typeof options['centered'] != 'boolean') {
            this.options['centered'] = DEFAULT_WINDOW['centered'];
            this.warn(`Option 'centered' was not specified / is invalid. Automatically set to default value of '${DEFAULT_WINDOW['centered']}'.`);
        }
        else this.options['centered'] = options['centered'];

        // shadow
        if (!options['shadow'] || typeof options['shadow'] != 'string' || ['always', 'hover', 'active', 'none'].indexOf(options['shadow'].trim()) == -1) {
            this.options['shadow'] = DEFAULT_WINDOW['shadow'];
            this.warn(`Option 'shadow' was not specified / is invalid. Automatically set to default value of '${DEFAULT_WINDOW['shadow']}'.`);
        }
        else this.options['shadow'] = options['shadow'];
        
        // title
        if (!options['title'] || typeof options['title'] != 'string') {
            this.options['title'] = DEFAULT_WINDOW['title'];
            this.warn(`Option 'title' was not specified / is invalid. Automatically set to default value of '${DEFAULT_WINDOW['title']}'.`);
        }
        else this.options['title'] = options['title'].trim();

        // dark mode
        if (options['darkMode'] == null || typeof options['darkMode'] != 'boolean') {
            this.options['darkMode'] = DEFAULT_WINDOW['darkMode'];
            this.warn(`Option 'darkMode' was not specified / is invalid. Automatically set to default value of '${DEFAULT_WINDOW['darkMode']}'.`);
        }
        else this.options['darkMode'] = options['darkMode'];

        // buttons
        if (!options['buttons'] || typeof options['buttons'] != 'object') {
            this.options['buttons'] = DEFAULT_WINDOW['buttons'];
            this.warn(`Option 'buttons' was not specified / is invalid. Automatically set to default value of '${DEFAULT_WINDOW['buttons']}'`);
        }
        else {

            this.options['buttons'] = {
                min: null,
                max: null,
                exit: null
            };

            // buttons.min
            if (options['buttons']['min'] == null || typeof options['buttons']['min'] != 'boolean') {
                this.options['buttons']['min'] = DEFAULT_WINDOW['buttons']['min'];
                this.warn(`Options 'buttons.min' was not specified / is invalid. Automatically set to default value of '${DEFAULT_WINDOW['buttons']['min']}'`);
            }
            else this.options['buttons']['min'] = options['buttons']['min'];

            // buttons.max
            if (options['buttons']['max'] == null || typeof options['buttons']['max'] != 'boolean') {
                this.options['buttons']['max'] = DEFAULT_WINDOW['buttons']['max'];
                this.warn(`Options 'buttons.max' was not specified / is invalid. Automatically set to default value of '${DEFAULT_WINDOW['buttons']['max']}'`);
            }
            else this.options['buttons']['max'] = options['buttons']['max'];

            // buttons.exit
            if (options['buttons']['exit'] == null || typeof options['buttons']['exit'] != 'boolean') {
                this.options['buttons']['exit'] = DEFAULT_WINDOW['buttons']['exit'];
                this.warn(`Options 'buttons.max' was not specified / is invalid. Automatically set to default value of '${DEFAULT_WINDOW['buttons']['exit']}'`);
            }
            else this.options['buttons']['exit'] = options['buttons']['exit'];

        }

    }

    /**
     * Registers mouse events, custom styles, and more to the window.
     */
    init() {

        if (this.options.debug) this.info('Initializing window...');

        if (this.options.debug) this.info('Setting styles...');
        this.window.classList.add('wingman');

        if (this.options.darkMode) this.window.classList.add('wingman-dark');
        else this.window.classList.add('wingman-light');

        this.window.style.width = `${this.options.width}px`;
        this.window.style.height = `${this.options.height}px`;
        this.window.style.minWidth = `${this.options.minWidth}px`;
        this.window.style.minHeight = `${this.options.minHeight}px`;

        if (this.options.centered) {
            if (this.options.debug) this.info('Centering window...');

            // find container element, if it exists (similar to jQuery .closest() method)
            this.windowContainer = this.window.closest('.wingman-container');

            if (this.windowContainer) {
                const x = Math.round(
                    this.windowContainer.offsetTop + this.windowContainer.clientWidth / 2 - parseInt(this.window.style.width) / 2
                );
                const y = Math.round(
                    this.windowContainer.offsetLeft + this.windowContainer.clientHeight / 2 - parseInt(this.window.style.height) / 2
                );

                this.window.style.left = `${x}px`;
                this.window.style.top = `${y}px`;
            }
            else this.warn(`Failed to find a container element for the window with ID '${this.id}'.`);

        }

        switch (this.options.shadow) {

            case 'always':
                this.window.classList.add('wingman-shadow-always');
                break;

            case 'hover':
                this.window.classList.add('wingman-shadow-hover');
                break;

            case 'active':
                this.window.classList.add('wingman-shadow-active');
                break;

        }

        if (this.options.debug) this.info('Creating window content...');
        // header
        this.header = document.createElement('header');

        this.headerTitle = document.createElement('span');
        this.headerTitle.classList.add('wingman-header-title');
        this.headerTitle.innerText = this.options.title;

        this.header.appendChild(this.headerTitle);

        if (this.options.debug) this.info('Registering draggable feature...');
        if (this.options.draggable) this.headerTitle.classList.add('wingman-draggable');

        // window body
        this.windowContentWrapper = document.createElement('div');
        this.windowContentWrapper.classList.add('wingman-content-wrapper');

        this.windowContent = document.createElement('div');
        this.windowContent.classList.add('wingman-content');
        this.windowContent.innerHTML = this.window.innerHTML;

        this.window.innerHTML = '';

        this.windowContentWrapper.appendChild(this.windowContent);

        // resizers
        if (this.options.resizable) {
            if (this.options.debug) this.info('Registering resizable feature...');
            this.window.classList.add('wingman-resizable');

            this.resizerEastWest = document.createElement('div');
            this.resizerEastWest.classList.add('wingman-resizer');
            this.resizerEastWest.classList.add('wingman-resizer-ew');
            
            this.resizerEastWest.onmousedown = this.onstartresize.bind(this);
    
            this.resizerNorthSouth = document.createElement('div');
            this.resizerNorthSouth.classList.add('wingman-resizer');
            this.resizerNorthSouth.classList.add('wingman-resizer-ns');

            this.resizerNorthSouth.onmousedown = this.onstartresize.bind(this);
        }

        // buttons
        if (this.options.buttons.min || this.options.buttons.max || this.options.buttons.exit) {

            if (this.options.debug) this.info('Building control buttons...');
            
            this.buttonsWrapper = document.createElement('div');
            this.buttonsWrapper.classList.add('wingman-controls');

            /**
             * @type {{ minimize: HTMLDivElement, maximize: HTMLDivElement, exit: HTMLDivElement }}
             */
            this.buttons = {
                minimize: null,
                maximize: null,
                exit: null
            };

            // minimize button
            if (this.options.buttons.min) {
                if (this.options.debug) this.info('Building minimize control...');

                this.buttons.minimize = document.createElement('div');
                this.buttons.minimize.classList.add('wingman-control');
                this.buttons.minimize.classList.add('wingman-control-minimize');

                this.buttons.minimize.onclick = this.onminimize.bind(this);

                const svg = document.createElement('div');
                svg.classList.add('wingman-control-icon');
                svg.classList.add('wingman-control-icon-minimize');

                this.buttons.minimize.appendChild(svg);
                this.buttonsWrapper.appendChild(this.buttons.minimize);
            }

            // maximize button
            if (this.options.buttons.max) {
                if (this.options.debug) this.info('Building maximize control...');

                this.buttons.maximize = document.createElement('div');
                this.buttons.maximize.classList.add('wingman-control');
                this.buttons.maximize.classList.add('wingman-control-maximize');

                this.buttons.maximize.onclick = this.onmaximize.bind(this);

                const svg = document.createElement('div');
                svg.classList.add('wingman-control-icon');
                svg.classList.add('wingman-control-icon-maximize');

                this.buttons.maximize.appendChild(svg);
                this.buttonsWrapper.appendChild(this.buttons.maximize);
            }

            // exit button
            if (this.options.buttons.exit) {
                if (this.options.debug) this.info('Building exit control...');

                this.buttons.exit = document.createElement('div');
                this.buttons.exit.classList.add('wingman-control');
                this.buttons.exit.classList.add('wingman-control-exit');

                this.buttons.exit.onclick = this.onexit.bind(this);

                const svg = document.createElement('div');
                svg.classList.add('wingman-control-icon');
                svg.classList.add('wingman-control-icon-exit');

                this.buttons.exit.appendChild(svg);
                this.buttonsWrapper.appendChild(this.buttons.exit);
            }

            this.header.appendChild(this.buttonsWrapper);

        }


        // assemble window
        if (this.options.debug) this.info('Building final window...');

        this.window.appendChild(this.header);
        this.window.appendChild(this.windowContentWrapper);
        if (this.options.resizable) {
            this.window.appendChild(this.resizerEastWest);
            this.window.appendChild(this.resizerNorthSouth);
        }

        // add listeners
        if (this.options.debug) this.info('Registering event listeners...');
        if (this.options.draggable) this.headerTitle.onmousedown = this.onstartdrag.bind(this);

    }

    /**
     * Called when the minimize button control is clicked.
     */
    onminimize() {
        
        // turn minimize button into restore button
        this.buttons.minimize.onclick = this.onrestore.bind(this);

        // register header with special callback
        this.headerTitle.onmousedown = (() => {
            this.onrestore.bind(this);
            this.onstartdrag.bind(this);
        }).bind(this);
            

        // save current dimensions
        this.dimensions.x = this.window.offsetTop;
        this.dimensions.y = this.window.offsetLeft;
        this.dimensions.w = this.window.clientWidth;
        this.dimensions.h = this.window.clientHeight;

        const headerHeight = getComputedStyle(document.documentElement).getPropertyValue('--wingman-header-height');

        // put window in minimized position
        this.window.style.top = `unset`;
        this.window.style.left = `40px`;
        this.window.style.bottom = `0px`;
        this.window.style.width = `250px`;
        this.window.style.minWidth = `250px`;
        this.window.style.height = headerHeight;
        this.window.style.minHeight = headerHeight;

        this.windowContentWrapper.style.display = 'none';

    }

    /**
     * Called when the restore button control is clicked.
     */
    onrestore() {
        
        // reset buttons
        if (this.buttons.minimize) this.buttons.minimize.onclick = this.onminimize.bind(this);
        if (this.buttons.maximize) this.buttons.maximize.onclick = this.onmaximize.bind(this);

        // re-register header
        this.headerTitle.onmousedown = this.onstartdrag.bind(this);

        this.window.style.top = `${this.dimensions.x}px`;
        this.window.style.left = `${this.dimensions.y}px`;
        this.window.style.width = `${this.dimensions.w}px`;
        this.window.style.minWidth = `${this.options.minWidth}px`;
        this.window.style.height = `${this.dimensions.h}px`;
        this.window.style.minHeight = `${this.options.minHeight}px`;

        this.windowContentWrapper.style.display = 'initial';

    }

    /**
     * Called when the maximize button control is clicked.
     */
    onmaximize() {
        
        // turn maximize button into restore button
        this.buttons.maximize.onclick = this.onrestore.bind(this);

        // register header with special callback
        this.headerTitle.onmousedown = ((e) => {
            this.onrestore();
            this.onstartdrag(e);
        }).bind(this);

        // save current dimensions
        this.dimensions.x = this.window.offsetTop;
        this.dimensions.y = this.window.offsetLeft;
        this.dimensions.w = this.window.clientWidth;
        this.dimensions.h = this.window.clientHeight;

        this.window.style.top = `${this.windowContainer.offsetTop}px`;
        this.window.style.left = `${this.windowContainer.offsetLeft}px`;
        this.window.style.width = `${this.windowContainer.clientWidth}px`;
        this.window.style.height = `${this.windowContainer.clientHeight}px`;

    }

    /**
     * Called when the exit button control is clicked.
     */
    onexit() {

        this.info(`Recieved 'exit' command from user, closing window... (${this.id})`);
        this.destroy();

    }

    /**
     * Destroys this window manager.
     * @param {boolean} destroyElement - Whether or not to destroy the window element as well.
     */
    destroy(destroyElement=true) {

        this.onclosedrag();
        this.headerTitle.onmousedown = null;

        this.oncloseresize();

        this.resizerEastWest.onmousedown = null;
        this.resizerNorthSouth.onmousedown = null;

        if (this.buttons.minimize) this.buttons.minimize.onclick = null;
        if (this.buttons.maximize) this.buttons.maximize.onclick = null;
        if (this.buttons.exit) this.buttons.exit.onclick = null;

        if (destroyElement) this.window.remove();

    }

    /**
     * Called when starting to drag this window.
     * @param {MouseEvent} e - The mousedown mouse event.
     */
    onstartdrag(e) {

        e = e || window.event;

        this.dragPos[2] = e.clientX;
        this.dragPos[3] = e.clientY;

        document.onmouseup = this.onclosedrag.bind(this);
        document.onmousemove = this.ondrag.bind(this);

    }

    /**
     * Called whilst dragging this window.
     * @param {MouseEvent} e - The mousemove mouse event.
     */
    ondrag(e) {

        if (this.options.draggable) {

            e = e || window.event;
            e.preventDefault();
    
            this.dragPos[0] = this.dragPos[2] - e.clientX;
            this.dragPos[1] = this.dragPos[3] - e.clientY;
            this.dragPos[2] = e.clientX;
            this.dragPos[3] = e.clientY;
    
            this.window.style.top = (this.window.offsetTop - this.dragPos[1]) + 'px';
            this.window.style.left = (this.window.offsetLeft - this.dragPos[0]) + 'px';

        }

    }

    /**
     * Called when performing the mouseup mouse event on this window.
     */
    onclosedrag() {

        document.onmouseup = null;
        document.onmousemove = null;

    }

    /**
     * Called when starting to resize this window.
     * @param {MouseEvent} e - The mousedown mouse event.
     */
    onstartresize(e) {

        this.resizePos[0] = e.clientX;
        this.resizePos[1] = e.clientY;

        // update dimensions of the window
        const style = window.getComputedStyle(this.window);
        this.dimensions.w = parseInt(style.width, 10);
        this.dimensions.h = parseInt(style.height, 10);

        // attach listeners
        document.onmousemove = this.onresize.bind(this);
        document.onmouseup = this.oncloseresize.bind(this);

    }

    /**
     * Called whilst resizing this window.
     * @param {MouseEvent} e - The mousemove mouse event.
     */
    onresize(e) {

        // calc mouse movement
        const dx = e.clientX - this.resizePos[0];
        const dy = e.clientY - this.resizePos[1];

        // calc new width
        const w = this.dimensions.w + dx;
        const h = this.dimensions.h + dy;

        // resize window
        if (!isNaN(w) && w > 0) this.window.style.width = `${w}px`;
        if (!isNaN(h) && h > 0) this.window.style.height = `${h}px`;

    }

    /**
     * Called when stopping resizing the window.
     * @param {MouseEvent} e - The mouseup mouse event.
     */
    oncloseresize(e) {

        // remove listeners
        document.onmousemove = null;
        document.onmouseup = null;

    }

    /**
     * Generates a UUID.
     * @returns {string} A generated UUID.
     */
    generateID() {

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

    }

    /**
     * Prints a message to the console without a prefix and with a custom style.
     * @param {*} message - The message to print.
     * @param {WingmanLogStyle} style - The style to use.
     */
    raw(message, style) {

        console.log('%c' + message, style.join(';') + ';');

    }

    /**
     * Logs a message to the console for this window.
     * @param {*} message - The message to log.
     */
    log(message) {

        console.log('%c' + WINGMAN_PREFIX + '%c' + message, LogStyle.Prefix.join(';') + ';', LogStyle.Log.join(';') + ';');

    }

    /**
     * Infos a message to the console for this window.
     * @param {*} message - The message to info.
     */
    info(message) {

        console.info('%c' + WINGMAN_PREFIX + '%c' + message, LogStyle.Prefix.join(';') + ';', LogStyle.Info.join(';') + ';');

    }

    /**
     * Warns a message to the console for this window.
     * @param {*} message - The message to warn.
     */
    warn(message) {

        console.warn('%c' + WINGMAN_PREFIX + '%c' + message, LogStyle.Prefix.join(';') + ';', LogStyle.Warn.join(';') + ';');

    }

    /**
     * Errors a message to the console for this window.
     * @param {*} message - The message to error.
     */
    error(message) {

        console.error('%c' + WINGMAN_PREFIX + '%c' + message, LogStyle.Prefix.join(';') + ';', LogStyle.Error.join(';') + ';');

    }

}