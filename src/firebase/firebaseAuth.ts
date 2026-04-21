import {
    type User,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    deleteUser,
    browserLocalPersistence,
    browserSessionPersistence,
    inMemoryPersistence,
    setPersistence,
    onAuthStateChanged
} from "firebase/auth";

import { auth } from "./firebase";

interface AuthUser {
    displayName: string | null;
    email: string | null;
    uid: string;
}

type AuthPersistence = "local" | "session" | "none"

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            unsubscribe();

            if (firebaseUser) {
                resolve({
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName,
                    email: firebaseUser.email,
                });
            } else {
                resolve(null);
            }
        });
    });
}

export async function setAuthPersistence(type: AuthPersistence) {
    switch (type) {
        case "local":
            await setPersistence(auth, browserLocalPersistence);
            break;
        case "session":
            await setPersistence(auth, browserSessionPersistence);
            break;
        case "none":
            await setPersistence(auth, inMemoryPersistence);
            break;
        default:
            await setPersistence(auth, browserLocalPersistence);
    }
}

export async function logIn(
    email: string,
    password: string,
): Promise<AuthUser> {

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
    };
}

export function logOut() {
    return signOut(auth);
}

export async function googleSignIn() {

    const googleAuthProvider = new GoogleAuthProvider();
    googleAuthProvider.setCustomParameters({
        prompt: "select_account",
    });

    return signInWithPopup(auth, googleAuthProvider);
}

export async function deleteCurrentUser(user: User) {
    return await deleteUser(user);
}

export async function signUp(
    email: string,
    password: string,
    name: string,
): Promise<AuthUser> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });

    return {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
    };
}
