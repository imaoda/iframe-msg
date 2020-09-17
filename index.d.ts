type Cb = (data: any, cb: (msg?: any) => void | any) => void | any;

export function setDefaultSon(name: string | HTMLIFrameElement): void;

export function setMsgHandler(fn: any): void;

export function sendSon(
  data: any,
  name?: string | HTMLIFrameElement
): Promise<any>;

export function sendDad(
  data: any,
  name?: string | HTMLIFrameElement
): Promise<any>;
