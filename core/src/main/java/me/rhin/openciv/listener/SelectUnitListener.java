package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;

public interface SelectUnitListener extends Listener {

	public void onSelectUnit(Unit unit);

	public static class SelectUnitEvent extends Event<SelectUnitListener> {

		private Unit unit;

		public SelectUnitEvent(Unit unit) {
			this.unit = unit;
		}

		@Override
		public void fire(ArrayList<SelectUnitListener> listeners) {
			for (SelectUnitListener listener : listeners) {
				listener.onSelectUnit(unit);
			}
		}

		@Override
		public Class<SelectUnitListener> getListenerType() {
			return SelectUnitListener.class;
		}

	}
}
