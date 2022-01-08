package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.game.religion.PlayerReligion;
import me.rhin.openciv.game.religion.icon.ReligionIcon;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface ReligionIconChangeListener extends Listener {

	public void onReligionIconChange(PlayerReligion religion, ReligionIcon icon);

	public static class ReligionIconChangeEvent extends Event<ReligionIconChangeListener> {

		private PlayerReligion religion;
		private ReligionIcon icon;

		public ReligionIconChangeEvent(PlayerReligion religion, ReligionIcon icon) {
			this.religion = religion;
			this.icon = icon;
		}

		@Override
		public void fire(ArrayList<ReligionIconChangeListener> listeners) {
			for (ReligionIconChangeListener listener : listeners) {
				listener.onReligionIconChange(religion, icon);
			}
		}

		@Override
		public Class<ReligionIconChangeListener> getListenerType() {
			return ReligionIconChangeListener.class;
		}

	}
}
