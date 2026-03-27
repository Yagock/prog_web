import { useEffect, useRef, useState } from "react";
import { readStorage, writeStorage } from "../utils/storage";

export default function usePersistentState(key, initialValue, enabled = true) {
    const [state, setState] = useState(() => readStorage(key, initialValue));
    const hasMounted = useRef(false);

    useEffect(() => {
        if (!enabled) return;
        if (!hasMounted.current) {
            hasMounted.current = true;
            return;
        }
        writeStorage(key, state);
    }, [state, key, enabled]);

    return [state, setState];
}
