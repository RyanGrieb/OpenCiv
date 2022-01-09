package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.religion.PlayerReligion;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface GainFollowerListener extends Listener {

	public void onGainFollower(PlayerReligion religion, City city, int oldFollowerCount, int newFollowerCount);

	public static class GainFollowerEvent extends Event<GainFollowerListener> {

		private PlayerReligion religion;
		private City city;
		private int oldFollowerCount, newFollowerCount;

		public GainFollowerEvent(PlayerReligion religion, City city, int oldFollowerCount, int newFollowerCount) {
			this.religion = religion;
			this.city = city;
			this.oldFollowerCount = oldFollowerCount;
			this.newFollowerCount = newFollowerCount;
		}

		@Override
		public void fire(ArrayList<GainFollowerListener> listeners) {
			for (GainFollowerListener listener : listeners) {
				listener.onGainFollower(religion, city, oldFollowerCount, newFollowerCount);
			}
		}

		@Override
		public Class<GainFollowerListener> getListenerType() {
			return GainFollowerListener.class;
		}

	}

}
