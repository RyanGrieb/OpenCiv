package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ListItem;

public class ListBuilding extends ListItem {

	private Building building;
	private Sprite backgroundSprite;
	private CustomLabel buildingNameLabel;

	public ListBuilding(Building building, float width, float height) {
		super(width, height);
		this.building = building;
		backgroundSprite = TextureEnum.UI_GRAY.sprite();
		backgroundSprite.setSize(width, height);
		buildingNameLabel = new CustomLabel(building.getName());
		buildingNameLabel.setSize(width, height);
		buildingNameLabel.setAlignment(Align.topLeft);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);
		buildingNameLabel.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		buildingNameLabel.setPosition(x, y);
	}

}
