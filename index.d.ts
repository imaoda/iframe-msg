type Cb = (data: any, cb: (msg?: any) => void | any) => void | any;

function setDefaultSon(name: string | HTMLIFrameElement): void {}

function setMsgHandler(fn: any): void {}

function sendSon(data: any, name?: string | HTMLIFrameElement): Promise<any> {}

function sendDad(data: any, name?: string | HTMLIFrameElement): Promise<any> {}

export default { setDefaultSon, setMsgHandler, sendSon, sendDad };
