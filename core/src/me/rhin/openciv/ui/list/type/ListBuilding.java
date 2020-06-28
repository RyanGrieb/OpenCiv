package me.rhin.openciv.ui.list.type;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ListItem;

public class ListBuilding extends ListItem {

	private Building building;
	private Sprite backgroundSprite;
	private CustomLabel buildingNameLabel;
	private ArrayList<Sprite> statIcons;
	private ArrayList<CustomLabel> statLabels;

	public ListBuilding(Building building, float width, float height) {
		super(width, height);
		this.building = building;
		backgroundSprite = TextureEnum.UI_GRAY.sprite();
		backgroundSprite.setSize(width, height);
		buildingNameLabel = new CustomLabel(building.getName());
		buildingNameLabel.setSize(width, height);
		buildingNameLabel.setAlignment(Align.topLeft);

		this.statIcons = new ArrayList<>();
		this.statLabels = new ArrayList<>();

		for (Stat stat : building.getStatLine().getStatValues().keySet()) {
			Sprite sprite = TextureEnum.fromStat(stat).sprite();
			sprite.setSize(16, 16);
			statIcons.add(sprite);

			CustomLabel label = new CustomLabel("+" + (int) building.getStatLine().getStatValue(stat));
			statLabels.add(label);
		}
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);
		buildingNameLabel.draw(batch, parentAlpha);

		for (Sprite sprite : statIcons)
			sprite.draw(batch);

		for (CustomLabel label : statLabels)
			label.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		buildingNameLabel.setPosition(x, y);

		float originX = x;
		for (int i = 0; i < statIcons.size(); i++) {
			Sprite sprite = statIcons.get(i);
			CustomLabel label = statLabels.get(i);
			sprite.setPosition(originX, y);
			originX += sprite.getWidth();
			label.setPosition(originX, y + label.getHeight() / 2);
			originX += label.getWidth() + 4;
		}
	}

}
