import Tools from "./util/Tools";
import Option from "./util/Option";
import EditorView from "./EditorView";
import NotificationManagerImpl from "../ui/NotificationManagerImpl";
import Delay from "./util/Delay";

export default class NotificationManager {
    constructor(editor) {
        this.editor = editor;
        this._notifications = [];

        editor.on("SkinLoaded", () => {
            let serviceMessage = editor.settings.serviceMessage;
            if (serviceMessage) {
                this.open({
                    text: serviceMessage,
                    type: "warning",
                    timeout: 0,
                });
            }
        });

        // NodeChange is needed for inline mode and autoresize as the positioning is done
        // from the bottom up, which changes when the content in the editor changes.
        editor.on("ResizeEditor ResizeWindow NodeChange", () => {
            Delay.requestAnimationFrame(reposition);
        });

        editor.on("remove", () => {
            Tools.each(this._notifications.slice(), (notification) => {
                this.__getImplementation().close(notification);
            });
        });
    }

    close() {
        Option.from(this._notifications[0]).each((notification) => {
            this.__getImplementation().close(notification);
            this.__closeNotification(notification);
            this.__reposition();
        });
    }

    open(args) {
        let editor = this.editor;

        // Never open notification if editor has been removed.
        if (editor.removed || !EditorView.isEditorAttachedToDom(editor)) {
            return;
        }

        return Tools.find(this._notifications, (notification) => {
            return this.__isEqual(this.__getImplementation().getArgs(notification), args);
        })
        .getOrThunk(() => {
            let notification = this.__getImplementation().open(args, () => {
                this.__closeNotification(notification);
                this.__reposition();
            });

            editor.editorManager.setActive(editor);
            this._notifications.push(notification);
            this.__reposition();
            return notification;
        });
    }

    getNotifications() {
        return this._notifications;
    }

    __closeNotification(notification) {
        Tools.find(this._notifications, (otherNotification) => {
            return otherNotification === notification;
        })
        .each((index) => {
            // Mutate here since third party might have stored away the window array
            // TODO: Consider breaking this api
            this._notifications.splice(index, 1);
        });
    }

    __getImplementation() {
        let theme = this.editor.theme;
        return theme && theme.getNotificationManagerImpl ? theme.getNotificationManagerImpl() : new NotificationManagerImpl();
    }

    __isEqual(a, b) {
        return a.type === b.type && a.text === b.text && !a.progressBar && !a.timeout && !b.progressBar && !b.timeout;
    }

    __reposition() {
        if (this._notifications.length > 0) {
            this.__getImplementation().reposition(this._notifications);
        }
    }
}