import { notificationBox, splitByCharN, unicodeB64Decode, unicodeB64Encode, toClipboard } from "./modules/common.js";
import { Modal } from "./modules/modal.js";
import { BoardData, BoardState, BoardSummary } from "./board.js";
import { HIGHLIGHT_STEP_DURATION } from "./main.js";

type UID = string;
type UserKey = string;
type RID = string;

// import WebSocket from 'ws';

const JOIN_ROOM = "Join";
const LEAVE_ROOM = "Leave";

interface User {
    uid: UID;
    key: UserKey;
    nick: string;
    room: RID;
}

interface Room {
    rid: RID;
    board: string;
    nick: string;
    password: string;
}

interface RoomDescriptor {
    nick: string;
    password: boolean;
    playerCount: number;
}

const auth = (u: User) => `${u.uid} ${u.key}`;

const iPing = "PONG\n";
const oPing = () => "PING\n";
const oHello = () => "HELLO\n";
const oHelloExistingUser = (u: User) => `HELLO ${auth(u)}\n`;
const oNewRoom = (u: User, b64Name: string = "", b64Password: string = "") => `NEWROOM ${auth(u)} ${b64Name}${b64Password != "" ? " " + b64Password : ""}\n`;
const oListRooms = () => "ROOMS\n";
const oJoinRoom = (u: User, r: RID, b64Password: string = "") => `JOIN ${auth(u)} ${r}${b64Password != "" ? " " + b64Password : ""}\n`;
const oLeaveRoom = (u: User) => `LEAVE ${auth(u)}\n`;
const oSetBoard = (u: User, b64Board: string) => `SETBOARD ${auth(u)} ${b64Board}\n`;
const oGetBoard = (u: User) => `BOARD ${auth(u)}\n`;
const oDownloadBoard = (date: string) => `DLBOARD ${date}\n`;
const oBoardSummaries = () => `BOARDSUMMARIES\n`;

const oGuess = (u: User, x: number, y: number) => `GUESS ${auth(u)} ${x} ${y}\n`;
const oEndGuess = (u: User) => `ENDGUESS ${auth(u)}\n`;
const oHint = (u: User) => `HINT ${auth(u)}\n`;

const oThemeWord = (w: string) => `TWORD ${w}\n`;
const oSpangram = (coords: number[][]) => {
    let out = `SPANGRAM`;
    for (const pair of coords) {
        out += ` ${pair[0]},${pair[1]}`;
    }
    out += `\n`;
    return out;
}
const oCurrentGuess = (coords: number[][]) => {
    let out = `CURRENTGUESS`;
    for (const pair of coords) {
        out += ` ${pair[0]},${pair[1]}`;
    }
    out += `\n`;
    return out;
}

const oWordsToGetHint = (w: number) => `WORDSTOHINT ${w}\n`;

const oGetState = (u: User) => `GETSTATE ${auth(u)}\n`;

const oForward = (u: User, fu: User, msg: string) => `FORWARD ${auth(u)} ${fu.uid} ${msg}\n`;

const iSuccess = "COOL\n";
const iFail = "NO\n";
const iStart = "START\n";
const iFinished = "END\n";
const iInvalid = "INVALID\n";

const iHello = "HELLO";
const iNewRoom = "NEWROOM"
const iListRooms = "ROOM";
const iGetBoard = "BOARD";
const iBoardSummaries = "BOARDSUMMARY";
const iGuess = "GUESS";
const iEndGuess = "ENDGUESS\n";
const iHint = "HINT\n";
const iReqStateFromHost = "HOSTSTATE";
const iThemeWord = "TWORD";
const iSpangram = "SPANGRAM";
const iCurrentGuess = "CURRENTGUESS";
const iWordsToGetHint = "WORDSTOHINT";
const iNewHost = "NEWHOST\n";
const iPlayerJoined = "JOINED";
const iPlayerLeft = "LEFT";

export class MultiplayerClient {
    private _url: string;
    user: User;
    room: Room = {rid: "", board: ""};
    host: boolean;
    private _ws: WebSocket;
    private _connected: boolean = false;
    private _roomToJoin: RID;
    private _successFunc: () => void = () => {};
    private _failFunc: () => void = () => {};
    private _endFunc: () => void = () => {};
    private _invalidFunc: () => void = () => {};
    private _roomJoinFunc: (success: boolean) => void = (success: boolean) => {};
    private _newRoomFunc: (success: boolean) => void = (success: boolean) => {};

    onGuess: (x: number, y: number) => void = (x: number, y: number) => { console.log("Guessed", x, y); };
    onEndGuess: () => void = () => { console.log("Guess ended!"); };
    onHintUsed: () => void = () => { console.log("Hint used!"); };
    onBoardRequest: () => BoardState;
    onHostPromotion: () => void = () => { console.log("Became host."); };
    onBoardStateThemeWord: (w: string) => void = (w: string) => { console.log("word:", w); };
    onBoardStateSpangram: (coords: number[][]) => void = (coords: number[][]) => { console.log("Spangram coords:", coords); };
    onBoardStateWordsToGetHint: (w: number) => void = (w: number) => { console.log("Words to get hint:", w); };
    onPlayerJoined: (u: UID) => void = (u: UID) => { console.log("Player", u, "joined."); };
    onPlayerLeft: (u: UID) => void = (u: UID) => { console.log("Player", u, "left"); };
    onBoardSummaryAdded: (summary: BoardSummary) => void = (summary: BoardSummary) => { console.log("date", summary.date, "clue", summary.clue, "editor", summary.editor); };
    onBoardReceived: () => void = () => {};

    private _callBacks: { [s: string]: () => void } = {};


    roomList: { [rid: RID]: RoomDescriptor } = {}; // RID to no. of occupants

    constructor(url: string) {
        this._url = url;
        // FIXME: Remove!
        (window as any).cli = this;
    }

    connect = (then: () => void = () => {}) => {
        
    }

    private _ping = () => {
        this._ws.send(oPing());
        if (this._connected) setTimeout(this._ping, 2 * 60000);
    };

    loginOrNewUser = (uid: UID, key: UserKey, then: () => void = () => {}) => {
        this.cmdHelloExistingUser(uid, key, () => {
            if (this.user.uid == "") { // Login failed
                console.log("Creds invalid, making new ones");
                this.cmdHello(() => {
                    then();
                });
            } else { then(); }
        });
    };
    
    cmdHelloExistingUser = (uid: UID, key: UserKey, then: () => void = () => {}) => {
        this._callBacks["HELLO"] = then;
        this._invalidFunc = then;
        this.user = {
            uid: "",
            key: "",
            nick: "",
            room: ""
        };
        const newUser: User = {
            uid: uid,
            key: key,
            nick: "",
            room: ""
        };
        this._ws.send(oHelloExistingUser(newUser));
    };

    cmdHello = (then: () => void = () => {}) => {
        this._callBacks["HELLO"] = then;
        this._ws.send(oHello());
    }

    respHello = (args: string[]) => {
        this.user = {
            uid: args[1] as UID,
            key: args[2] as UserKey,
            nick: "",
            room: ""
        };
        console.log("Logged in as", this.user);
        this._callBacks["HELLO"]();
    };

    cmdNewRoom = (nickname: string = "", password: string = "", then: (success: boolean) => void = (success: boolean) => {}) => {
        this._newRoomFunc = then;
        this.room = { password: password } as Room;
        this._ws.send(oNewRoom(this.user, unicodeB64Encode(nickname), unicodeB64Encode(password)));
    }

    respNewRoom = (args: string[]) => {
        console.log(`Created new room "${args[1]}"`);
        this.cmdJoinRoom(args[1] as RID, this.room.password, (success: boolean) => {
            this.host = true;
            this._newRoomFunc(success);
        });
    }

    cmdJoinRoom = (rid: RID, password: string = "", then: (success: boolean) => void = () => {}) => {
        this.host = false;
        this._roomJoinFunc = then;
        this._roomToJoin = rid;
        this.room.rid = "";
        this.room.board = "";
        this.room.password = password;
        this._successFunc = this.respJoinRoom;
        this._invalidFunc = () => {
            this._roomJoinFunc(false);
        };
        this._failFunc = this._invalidFunc;

        this._ws.send(oJoinRoom(this.user, rid, unicodeB64Encode(password)));
    }

    respJoinRoom = () => {
        this.user.room = this._roomToJoin;
        let nick = "";
        if (this._roomToJoin in this.roomList) {
            nick = this.roomList[this._roomToJoin].nick;
        }
        this.room = {
            rid: this._roomToJoin,
            board: "",
            nick: nick,
            password: this.room.password
        };
        console.log(`Joined room "${this.user.room}"`);
        this._roomJoinFunc(true);
    }

    cmdLeaveRoom = (then: () => void = () => {}) => {
        this._successFunc = () => {
            console.log("left room.");
            this.room = {rid: "", board: "", nick: "", password: ""};
            then();
        };
        this._ws.send(oLeaveRoom(this.user));
    }

    cmdListRooms = (then: () => void = () => {}) => {
        this._callBacks["LISTROOMS"] = then;
        this._ws.send(oListRooms());
        this.roomList = {};
        this._endFunc = () => {
            console.log("Rooms:", this.roomList);
            this._callBacks["LISTROOMS"]();
        };
    };

    respListRooms = (args: string[]) => {
        let nick = "";
        let password = false;
        if (args.length == 4) {
            let nickPass = args[3].split(" ", 2);
            nick = nickPass[0];
            password = (nickPass.length > 1 && nickPass[1] == "PASSWORD");
        } else if (args.length == 5) {
            nick = args[3];
            password = args[4] == "PASSWORD";
        }
        this.roomList[args[1] as RID] = {
            playerCount: +(args[2]),
            nick: nick == "NONE" ? "" : unicodeB64Decode(nick),
            password: password
        }
    };

    cmdSetBoard = (board: string, then: () => void = () => {}) => {
        if (this.room.rid == "") return;
        this._callBacks["SETBOARD"] = then;
        this._ws.send(oSetBoard(this.user, unicodeB64Encode(board)));
        this._successFunc = () => {
            console.log("Sent board.");
            this._callBacks["SETBOARD"]();
        };
    }

    cmdGetBoard = (then: () => void = () => {}) => {
        if (this.room.rid == "") return;
        this._callBacks["GETBOARD"] = () => {
            this.onBoardReceived();
            then();
        };
        this._ws.send(oGetBoard(this.user));
        this._failFunc = () => {
            this.onBoardReceived();
            then();
        };
    }

    respGetBoard = (args: string[]) => {
        this.room.board = unicodeB64Decode(args[1]);
        // console.log("Got board:", this.room.board);
        this._callBacks["GETBOARD"]();
    };

    cmdGuess = (x: number, y: number) => {
        if (this.room.rid == "") return;
        this._ws.send(oGuess(this.user, x, y));
    };

    cmdEndGuess = () => {
        if (this.room.rid == "") return;
        this._ws.send(oEndGuess(this.user));
    };

    respGuess = (args: string[]) => {
        let x = +(args[1]);
        let y = +(args[2]);
        this.onGuess(x, y);
    };

    respEndGuess = () => this.onEndGuess();

    cmdHint = () => {
        if (this.room.rid == "") return;
        this._ws.send(oHint(this.user));
    };

    respHint = () => this.onHintUsed();

    cmdGetState = () => {
        if (this.room.rid == "") return;
        this._ws.send(oGetState(this.user));
    }

    cmdDownloadBoard = (date: string, then: (board: string) => void = (board: string) => {}) => {
        this._callBacks["GETBOARD"] = () => {
            // console.log("got board!", this.room.board);
            then(this.room.board);
        };
        this._failFunc = () => {
            then("");
        };
        this._ws.send(oDownloadBoard(date));
    };

    cmdBoardSummaries = () => {
        this._ws.send(oBoardSummaries());
    };

    respBoardSummaries = (args: string[]) => {
        let summary: BoardSummary = {
            date: args[1],
            clue: unicodeB64Decode(args[2]),
            editor: unicodeB64Decode(args[3])
        };
        this.onBoardSummaryAdded(summary);
    };

    respReqStateFromHost = (args: string[]) => {
        let target: User = {
            uid: args[1] as UID,
            key: "",
            nick: "",
            room: ""
        };
        const bd = this.onBoardRequest();
        for (const w of bd.themeWordsFound) {
            this._ws.send(oForward(this.user, target, oThemeWord(w)));
        }
        if (bd.spangramFound) {
            this._ws.send(oForward(this.user, target, oSpangram(bd.spangramCoords)));
        }
        if (bd.currentGuess.length != 0) {
            this._ws.send(oForward(this.user, target, oCurrentGuess(bd.currentGuess)));
        }
        this._ws.send(oForward(this.user, target, oWordsToGetHint(bd.wordsToGetHint)));
    }

    processIncomingCoords = (args: string[]): number[][] => {
        let pairStrings = [];
        for (let i = 1; i < args.length; i++) {
            if (i == args.length-1) {
                let split = args[i].split(" ");
                pairStrings = pairStrings.concat(split);
            } else {
                pairStrings.push(args[i]);
            }
        }
        let coords: number[][] = [];
        for (let i = 0; i < pairStrings.length; i++) {
            let sc = pairStrings[i].split(",");
            coords.push([+sc[0], +sc[1]]);
        }
        return coords
    };

    processSpangramCoords = (args: string[]) => {
        const coords = this.processIncomingCoords(args);
        this.onBoardStateSpangram(coords);
    }

    processCurrentGuess = (args: string[]) => {
        const coords = this.processIncomingCoords(args);
        // console.log("got coords", coords);
        let i = 0; 
        const addLoop = () => {
            this.onGuess(coords[i][1], coords[i][0]);
            i++
            if (i != coords.length) setTimeout(addLoop, HIGHLIGHT_STEP_DURATION);
        };
        addLoop();
    }
}

interface window extends Window {
    notif: notificationBox;
}

declare var window: window;


export class MultiplayerUI {
    cli: MultiplayerClient;
    board: string;
    private _boardLoader: (board: BoardData) => void;
    private _modal: Modal;
        
    onJoinRoom = (success: boolean = false) => {
        if (!success) {
            window.notif.customError("failedJoin", "Couldn't join room.");
            return;
        }
        this.cli.cmdGetBoard();
        let url = this.urlFromRID(this.cli.room.rid, unicodeB64Encode(this.cli.room.password));
        window.history.pushState({}, "", url);

        this._modal.close();
    }

    onLeaveRoom = () => {
        window.history.pushState({}, "", this.getBaseURL());
        this._modal.close();
        window.notif.customSuccess("roomLeft", `Room left.`);
    };

    ridFromURL = (): RID => {
        const urlParams = new URLSearchParams(window.location.search);
        let r = urlParams.get("room");
        if (r) return r as RID;
        else return "";
        /* let s = window.location.href.split("?room=");
        if (s.length < 2) return "";
        return s[s.length-1] as RID; */
    };

    passwordFromURL = (): string => {
        const urlParams = new URLSearchParams(window.location.search);
        let p = urlParams.get("password");
        if (p) return unicodeB64Decode(p);
        else return "";
        /* let s = window.location.href.split("&password=");
        if (s.length < 2) return "";
        return unicodeB64Decode(s[s.length-1]); */
    };

    urlFromRID = (rid: RID, b64Password: string = ""): string => {
        let url = window.location.href.split("?room=")[0];
        if (url.at(url.length-1) != "/") url += "/";
        url += "?room=" + rid;
        if (b64Password != "") {
            url += `&password=` + b64Password;
        }
        return url;
    };

    getBaseURL = (): string => {
        let s = window.location.href.split("?room=");
        return s[0];
    };

    connect = () => {
        let uid = localStorage.getItem("uid") as UID;
        let ukey = localStorage.getItem("key") as UserKey;
        this.cli.connect(() => this.cli.loginOrNewUser(uid, ukey, () => {
            localStorage.setItem("uid", this.cli.user.uid);
            localStorage.setItem("key", this.cli.user.key);
            let rid = this.ridFromURL();
            let pw = this.passwordFromURL();
            if (rid != "") this.cli.cmdJoinRoom(rid, pw, this.onJoinRoom);
        }));
    }

    constructor(client: MultiplayerClient, modal: HTMLElement, roomTable: HTMLElement, roomCodeArea: HTMLElement, roomButton: HTMLButtonElement, roomLinkCopy: HTMLButtonElement, newRoomButton: HTMLButtonElement, newRoomInputs: HTMLDivElement, boardLoader: (board: BoardData) => void) {
        this.cli = client;
        this._boardLoader = boardLoader;

        
        this.cli.onHostPromotion = () => {
            window.notif.customInfo("hostPromotion", "", "You were made host.");
        };

        this.cli.onPlayerJoined = (u: UID) => {
            window.notif.customInfo("playerJoined", "", `Player "${u}" joined.`);
        };
        
        this.cli.onPlayerLeft = (u: UID) => {
            window.notif.customInfo("playerJoined", "", `Player "${u}" left.`);
        };

        this.cli.onBoardReceived = () => {
            // console.log("board:", this.cli.room.board, "host:", this.cli.host);
            if (this.cli.room.board == "" && this.cli.host) {
                this.cli.cmdSetBoard(this.board);
            } else if (!this.cli.host) {
                this._boardLoader(JSON.parse(this.cli.room.board) as BoardData);
            }
            if (!this.cli.host) {
                this.cli.cmdGetState();
            }
        };

        this._modal = new Modal(modal, false);
    }
}
