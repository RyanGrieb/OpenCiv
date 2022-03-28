package me.rhin.openciv.ui.game;

import java.util.ArrayList;
import java.util.Map.Entry;

import com.badlogic.gdx.scenes.scene2d.Group;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.religion.PlayerReligion;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.CityReligionFollowersUpdatePacket;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.label.CustomLabel;

public class CityReligionInfo extends Group implements Listener {

	// FIXME: Check if listener is removed properly

	private City city;
	private ColoredBackground blankBackground;
	private CustomLabel religionInfoDescLabel;
	private CustomLabel atheistsLabel;
	private ArrayList<ColoredBackground> religionIcons;
	private ArrayList<CustomLabel> religionFollowerLabels;

	public CityReligionInfo(City city, float x, float y, float width, float height) {
		setBounds(x, y, width, height);

		this.city = city;

		this.religionIcons = new ArrayList<>();
		this.religionFollowerLabels = new ArrayList<>();

		this.blankBackground = new ColoredBackground(TextureEnum.UI_POPUP_BOX_C.sprite(), 0, 0, width, height);
		addActor(blankBackground);

		this.religionInfoDescLabel = new CustomLabel("Religion Followers: ");
		religionInfoDescLabel.setPosition(6, height - 17);
		addActor(religionInfoDescLabel);

		this.atheistsLabel = new CustomLabel("None");
		atheistsLabel.setPosition(6, height - 44);

		initValues();

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onCityReligionFollowerUpdate(CityReligionFollowersUpdatePacket packet) {

		if (atheistsLabel.hasParent())
			removeActor(atheistsLabel);

		for (ColoredBackground icon : religionIcons)
			removeActor(icon);

		for (CustomLabel label : religionFollowerLabels)
			removeActor(label);

		initValues();
	}

	private void initValues() {
		if (city.getCityReligion().getBelieverCount() < 1)
			addActor(atheistsLabel);

		int index = 0;
		for (Entry<PlayerReligion, Integer> entrySet : city.getCityReligion().getMap().entrySet()) {
			if (entrySet.getValue() > 0) {

				ColoredBackground religionIcon = new ColoredBackground(
						entrySet.getKey().getReligionIcon().getTexture().sprite(), 6, getHeight() - 44 - (22 * index),
						16, 16);
				religionIcons.add(religionIcon);
				addActor(religionIcon);

				CustomLabel religionFollowerLabel = new CustomLabel(entrySet.getValue() + "");
				religionFollowerLabel.setPosition(religionIcon.getX() + religionIcon.getWidth() + 5,
						religionIcon.getY() + 4);
				religionFollowerLabels.add(religionFollowerLabel);
				addActor(religionFollowerLabel);

				index++;
			}
		}
	}
}
