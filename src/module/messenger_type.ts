type Event = object
type MessageObject = object
type SenderId = string;
type SessionId = string;
type ChannelId = string;
type RecipientId = string;
type EventType = string;
type MessageType = string;
export type MessengerType = 'line' | 'facebook' | 'google' | 'web'

export type StaticImplements<I extends new (...args: any[]) => any, C extends I> = InstanceType<C>;

export interface Messenger<Event> {
    validate_signature(req: any): boolean;
    refresh_token(): Promise<void>;
    extract_channel_id(event: Event): ChannelId;
    get_secret(): String;
    pass_through(webhook: String, secret: String, event: Event): any
    reply_to_collect(event: Event, messages: MessageObject[]): Promise<object>
    reply(event: Event, messages: MessageObject[]): Promise<object>
    send(event: Event, recipient_id: RecipientId, messages: MessageObject[]): Promise<object>
    multicast(event: Event, recipient_ids: RecipientId[], messages: MessageObject[]): Promise<object>
}

export interface MessengerStatic<Body, Event> {
    new(...args: any[]): Messenger<Event>;
    extract_events(body: Body): Event[];
    extract_beacon_event_type(event: Event): string;
    extract_param_value(event: Event):  string | object | undefined;
    extract_postback_payload(event: Event): string;
    check_supported_event_type(event: Event, flow: string): boolean
    extract_message(event: Event): MessageObject | undefined;
    extract_message_text(event: Event): String | undefined;
    extract_sender_id(event: Event): SenderId;
    extract_session_id(event: Event): SessionId;
    extract_to_id(event: Event): RecipientId;
    identify_event_type(event: Event): string;
    identify_message_type(message: MessageObject): string;
    compile_message(format: MessengerType, messageType: string, message: MessageObject): Promise<MessageObject>
}
