package me.rhin.openciv.ui.game;

import java.util.ArrayList;
import java.util.Map.Entry;

import com.badlogic.gdx.scenes.scene2d.Group;

import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.religion.PlayerReligion;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.label.CustomLabel;

public class CityReligionInfo extends Group {

	private City city;
	private BlankBackground blankBackground;
	private CustomLabel religionInfoDescLabel;
	private CustomLabel atheistsLabel;
	private ArrayList<ColoredBackground> religionIcons;
	private ArrayList<CustomLabel> religionFollowerLabels;

	public CityReligionInfo(City city, float x, float y, float width, float height) {
		setBounds(x, y, width, height);

		this.religionIcons = new ArrayList<>();
		this.religionFollowerLabels = new ArrayList<>();

		this.blankBackground = new BlankBackground(0, 0, width, height);
		addActor(blankBackground);

		this.religionInfoDescLabel = new CustomLabel("Religion Followers: ");
		religionInfoDescLabel.setPosition(2, height - 15);
		addActor(religionInfoDescLabel);

		this.atheistsLabel = new CustomLabel("None");
		atheistsLabel.setPosition(2, height - 40);
		if (city.getCityReligion().getBelieverCount() < 1)
			addActor(atheistsLabel);

		int index = 0;
		for (Entry<PlayerReligion, Integer> entrySet : city.getCityReligion().getMap().entrySet()) {
			if (entrySet.getValue() > 0) {

				ColoredBackground religionIcon = new ColoredBackground(
						entrySet.getKey().getReligionIcon().getTexture().sprite(), 2, height - 40 - (22 * index), 16,
						16);
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
