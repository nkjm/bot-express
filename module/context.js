"use strict";

const crypto = require("crypto");

module.exports = class Context {
    /**
     * @constructor
     * @param {*} [options]
     */
    constructor(options = {}){
        const o = options

        this.chat_id = o.chat_id || crypto.randomBytes(20).toString('hex')
        this.launched_at = o.launched_at || new Date().getTime()
        this.event = o.event
        this.intent = o.intent
        this.global = o.global || {}
        this.confirmed = o.confirmed || {}
        this.confirming = null
        this.to_confirm = []
        this.heard = o.heard || {}
        this.sender_language = o.sender_language || null
        this.translation = null
        this.param_change_history = []
        this.previous = { // To save history of current context.
            event: null,
            intent: [],
            confirmed: [],
            processed: [],
            message: []
        }
        this.archive = [] // To save history of previous context.
        this._flow = o.flow
        this._message_queue = []
        this._in_progress = false
        this._pause = false
        this._exit = false
        this._init = false
        this._switch_intent = o._switch_intent || null
        this._parent = o._parent || []
        this._parent_parameter = o._parent_parameter || {}
        this._sub_skill = o._sub_skill || false
        this._sub_parameter = o._sub_parameter || false
    }

    static get_archive(context){
        context.archive.unshift({
            chat_id: context.chat_id,
            launched_at: context.launched_at,
            event: context.event, 
            intent: context.intent,
            global: context.global,
            confirmed: context.confirmed,
            confirming: context.confirming,
            to_confirm: context.to_confirm,
            heard: context.heard, 
            sender_language: context.sender_language,
            translation: context.transation
        })
        return JSON.parse(JSON.stringify(context.archive));
    }

    /*
    static get_props(event){
        return {
            chat_id: null,
            launched_at: null,
            event: event,
            intent: null,
            confirmed: {},
            confirming: null,
            heard: {},
            sender_language: null,
            translation: null,
            previous: {
                event: null,
                intent: [],
                confirmed: [],
                processed: [],
                message: []
            }
        }
    }

    static get_hidden_props(flow){
        return {
            _flow: flow,
            _message_queue: [],
            _in_progress: false,
            _pause: false,
            _exit: false,
            _init: false,
            // _digging: false,
            _switch_intent: null
        }
    }
    */
}