package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.religion.PlayerReligion;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface LooseFollowerListener extends Listener {

	public void onLooseFollower(PlayerReligion religion, City city, int oldFollowerCount, int newFollowerCount);

	public static class LooseFollowerEvent extends Event<LooseFollowerListener> {

		private PlayerReligion religion;
		private City city;
		private int oldFollowerCount, newFollowerCount;

		public LooseFollowerEvent(PlayerReligion religion, City city, int oldFollowerCount, int newFollowerCount) {
			this.religion = religion;
			this.city = city;
			this.oldFollowerCount = oldFollowerCount;
			this.newFollowerCount = newFollowerCount;
		}

		@Override
		public void fire(ArrayList<LooseFollowerListener> listeners) {
			for (LooseFollowerListener listener : listeners) {
				listener.onLooseFollower(religion, city, oldFollowerCount, newFollowerCount);
			}
		}

		@Override
		public Class<LooseFollowerListener> getListenerType() {
			return LooseFollowerListener.class;
		}

	}

}
