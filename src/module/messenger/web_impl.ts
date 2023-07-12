import { MessengerStatic, MessengerType, StaticImplements } from "../messenger_type";
import MessengerLine from "./line";

type Body = Event

type Event = (MessageEvent | EnterEvent | PostbackEvent) & SenderIdHolder

type SenderIdHolder = {
    userId: SenderId
    channelId: ChannelId
}

type SenderId = string
type ChannelId = string

type PostbackEvent = {
    type: 'postback',
    postback: PostbackData
}

type PostbackData = {
    data: string,
    params: object
}

type EnterEvent = {
    type: 'enter'
}

type MessageEvent = {
    type: 'message'
    message: IncomingMessage
}

type IncomingMessage = IncomingMessageText | IncomingMessageImage | IncomingMessageLocation

type IncomingMessageText = {
    type: 'text'
    text: string
}

type IncomingMessageImage = {
    type: 'image'
}

type IncomingMessageLocation = {
    type: 'location'
}


type EventType = 'follow'

type MessageType = 'text' | 'image' | 'audio' | 'video' | 'file' | 'location' | 'sticker' | 'imagemap' | 'flex' | 'template'

type MessengerWebOptions = {
    sendMessage: (senderId: SenderId, messages: object[]) => void
}

export default class MessengerWeb implements StaticImplements<MessengerStatic<Body, Event>, typeof MessengerWeb> {
    sendMessage: (senderId: SenderId, messages: object[]) => void

    constructor(options: MessengerWebOptions) {
        this.sendMessage = options.sendMessage
    }

    static extract_events(body: Body): Event[] {
        return [body]
    }

    static extract_beacon_event_type(event: Event): string {
        throw new Error("Method not implemented.");
    }
    static extract_param_value(event: Event): string | IncomingMessage | PostbackData | undefined {
        let param_value;
        switch (event.type) {
            case "message":
                if (event.message.type == "text") {
                    param_value = event.message.text;
                } else {
                    param_value = event.message;
                }
                break
            case "postback":
                param_value = event.postback;
                break;
        }
        return param_value;
    }
    static extract_postback_payload(event: Event): string {
        if (event.type === "postback") {
            return event.postback.data
        } else {
            throw Error('no postback event given. cannot extract.')
        }
    }
    static check_supported_event_type(event: Event, flow: string): boolean {
        switch (flow) {
            case "start_conversation":
                if (event.type == "message" || event.type == "postback") {
                    return true;
                }
                return false;
            case "reply":
                if (event.type == "message" || event.type == "postback") {
                    return true;
                }
                return false;

            case "btw":
                if (event.type == "message" || event.type == "postback") {
                    return true;
                }
                return false;
            default:
                return false;
        }
    }

    static extract_message(event: Event): object | undefined {
        switch (event.type) {
            case "message":
                return event.message;
            case "postback":
                return event.postback;
        }
    }
    static extract_message_text(event: Event): string | undefined {
        switch (event.type) {
            case "message":
                switch (event.message.type) {
                    case 'text':
                        return event.message.text;
                    default:
                        return undefined
                }
            case "postback":
                return event.postback.data;
        }
    }
    static extract_sender_id(event: Event): string {
        return event.userId
    }
    static extract_session_id(event: Event): string {
        return event.userId
    }

    static extract_to_id(event: Event): string {
        throw new Error("Method not implemented.");
    }

    static identify_event_type(event: Event): string {
        if (!event.type) {
            return "unidentified"
        }
        return event.type
    }

    static identify_message_type(message: IncomingMessage): string {
        return message.type
    }

    static async compile_message(format: MessengerType, messageType: string, message: object): Promise<object> {
        if (format === 'line') {
            return message // web message format is compatible LINE message format
        } else if (format === 'facebook') {
            return MessengerLine._compile_message_from_facebook_format(messageType, message)
        } else {
            throw Error(`unsupported format ${format} given to web messenger`)
        }
    }

    validate_signature(req: any): boolean {
        // do nothing for now
        return true
    }

    extract_channel_id(event: Event): string {
        return event.channelId
    }


    reply_to_collect(event: Event, messages: object[]): Promise<object> {
        return this.reply(event, messages)
    }

    async reply(event: Event, messages: object[]): Promise<object> {
        return await this.send(event, event.userId, messages)
    }
    async send(event: Event, recipient_id: string, messages: object[]): Promise<object> {
        this.sendMessage(recipient_id, messages)
        return {}
    }

    multicast(event: Event, recipient_ids: string[], messages: object[]): Promise<object> {
        throw new Error("Unsupported operation");
    }

    async refresh_token(): Promise<void> {
        // nop
        return
    }

    get_secret(): String {
        throw new Error("Unsupported operation");
    }

    pass_through(webhook: String, secret: String, event: Event) {
        throw new Error("Unsupported operation");
    }
}