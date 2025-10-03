"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

// This component should only be used during development to surface security rule errors.
// It will not render anything in production.
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // In development, we want to throw the error to show Next.js's error overlay
      // which provides a better debugging experience with full stack traces.
      if (isDevelopment()) {
        // We throw it in a timeout to break out of the current event loop
        // and ensure Next.js catches it as an unhandled error.
        setTimeout(() => {
          throw error;
        }, 0);
      } else {
        // In production, we might just show a generic toast notification.
        console.error(error); // Log the full error for production monitoring
        toast({
          variant: "destructive",
          title: "Erro de Permissão",
          description: "Você não tem permissão para executar esta ação.",
        });
      }
    };

    errorEmitter.on("permission-error", handleError);

    return () => {
      errorEmitter.off("permission-error", handleError);
    };
  }, [toast]);

  // This component does not render anything itself.
  return null;
}
