import { WppEvent } from "../types";
import WppEventEmitter from "./emitter";

class HttpWppEventEmitter implements WppEventEmitter {
  constructor(private endpoints: string[]) {}

  public async emit(event: WppEvent): Promise<void> {
    for (const endpoint of this.endpoints) {
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });
      } catch (error) {
        console.error(`Failed to emit event to ${endpoint}:`, error);
      }
    }
  }
}

export default HttpWppEventEmitter;
