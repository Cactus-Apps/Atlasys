import React, { createContext, useContext, useEffect, useState } from "react";
import { updateManager, UpdateState } from "@/lib/update/expoUpdateCheck";

interface UpdateContextType {
  state: UpdateState;
  dismiss: () => void;
  reload: () => Promise<void>;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UpdateState>(updateManager.getState());

  useEffect(() => {
    const handleUpdate = (newState: UpdateState) => {
      setState(newState);
    };

    updateManager.on("update", handleUpdate);
    return () => {
      updateManager.off("update", handleUpdate);
    };
  }, []);

  const dismiss = () => {
    updateManager.dismissUpdate();
  };

  const reload = async () => {
    await updateManager.reloadApp();
  };

  return (
    <UpdateContext.Provider value={{ state, dismiss, reload }}>
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error("useUpdate must be used within UpdateProvider");
  }
  return context;
}
