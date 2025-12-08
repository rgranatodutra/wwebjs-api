import { WppEvent } from "../types";

abstract class WppEventEmitter {
  public abstract emit(event: WppEvent): Promise<void>;
}

export default WppEventEmitter;