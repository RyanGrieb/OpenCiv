package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.ui.screen.ScreenEnum;

public interface SetScreenListener extends Listener {

	public void onSetScreen(ScreenEnum prevScreenEnum, ScreenEnum screenEnum);

	public static class SetScreenEvent extends Event<SetScreenListener> {

		private ScreenEnum screenEnum;
		private ScreenEnum prevScreenEnum;

		public SetScreenEvent(ScreenEnum screen) {
			this.screenEnum = screen;
		}

		public SetScreenEvent(ScreenEnum prevScreenEnum, ScreenEnum screenEnum) {
			this.prevScreenEnum = prevScreenEnum;
			this.screenEnum = screenEnum;
		}

		@Override
		public void fire(ArrayList<SetScreenListener> listeners) {
			for (SetScreenListener listener : listeners) {
				listener.onSetScreen(prevScreenEnum, screenEnum);
			}
		}

		@Override
		public Class<SetScreenListener> getListenerType() {
			return SetScreenListener.class;
		}
	}

}
