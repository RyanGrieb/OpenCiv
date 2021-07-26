package me.rhin.openciv.game.notification.type;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.game.notification.NotificationPriority;
import me.rhin.openciv.listener.SetProductionItemListener;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.ui.window.type.CityInfoWindow;

public class AvailableProductionNotification extends AbstractNotification implements SetProductionItemListener {

	private ArrayList<City> cities;
	private int index;

	public AvailableProductionNotification(City city) {
		this.cities = new ArrayList<>();
		cities.add(city);

		Civilization.getInstance().getEventManager().addListener(SetProductionItemListener.class, this);
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

	@Override
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

	@Override
	public void act() {
		Civilization.getInstance().getWindowManager().toggleWindow(new CityInfoWindow(cities.get(index)));

		index++;

		if (index >= cities.size())
			index = 0;
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
