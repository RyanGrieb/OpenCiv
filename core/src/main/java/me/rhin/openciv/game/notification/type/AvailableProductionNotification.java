package me.rhin.openciv.game.notification.type;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.game.notification.NotificationPriority;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.packet.type.SetCityOwnerPacket;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;

public class AvailableProductionNotification extends AbstractNotification {

	private ArrayList<City> cities;

	public AvailableProductionNotification(City city) {
		this.cities = new ArrayList<>();
		cities.add(city);

		Civilization.getInstance().getEventManager().addListener(this);
	}

	public void merge(AbstractNotification notification) {
		super.merge(notification);

		AvailableProductionNotification productionNotification = (AvailableProductionNotification) notification;

		// Add cities that are not already in this notification.
		for (City city : productionNotification.getCities()) {
			boolean sameUnit = false;
			for (City currentCity : cities)
				if (city.getName().equals(currentCity.getName()))
					sameUnit = true;

			if (!sameUnit)
				cities.add(city);
		}
	}

	@EventHandler
	public void onSetProductionItem(SetProductionItemPacket packet) {
		City city = Civilization.getInstance().getGame().getPlayer().getCityFromName(packet.getCityName());

		// NOTE: This statement should never happen?
		if (!cities.contains(city))
			return;

		// ProducingItem producingItem =
		// city.getProducibleItemManager().getCurrentProducingItem();

		cities.remove(city);

		if (cities.size() < 1) {
			Civilization.getInstance().getGame().getNotificationHanlder().removeNotification(this);
		}
	}

	@EventHandler
	public void onSetCityOwner(SetCityOwnerPacket packet) {

		AbstractPlayer oldPlayer = Civilization.getInstance().getGame().getPlayers()
				.get(packet.getPreviousPlayerName());

		AbstractPlayer newPlayer = Civilization.getInstance().getGame().getPlayers().get(packet.getPlayerName());

		City city = newPlayer.getCityFromName(packet.getCityName());

		// If we contain the captured city and the prev owner is us, remove.
		if (cities.contains(city) && oldPlayer.equals(Civilization.getInstance().getGame().getPlayer())) {

			cities.remove(city);

			if (oldPlayer.getOwnedCities().size() < 1)
				Civilization.getInstance().getGame().getNotificationHanlder().removeNotification(this);
		}
	}

	@Override
	public void act() {
		if (cities.size() > 0)
			cities.get(0).onClick();
	}

	@Override
	public String getName() {
		return "Available production notification";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_PRODUCTION.sprite();
	}

	@Override
	public String getText() {
		return "A city is able to\nproduce items.";
	}

	@Override
	public NotificationPriority getPriorityLevel() {
		return NotificationPriority.MEDIUM;
	}

	public ArrayList<City> getCities() {
		return cities;
	}
}
