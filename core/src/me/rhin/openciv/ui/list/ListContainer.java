package me.rhin.openciv.ui.list;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.label.CustomLabel;

public class ListContainer extends ListItem {

	private ArrayList<ListItem> listItems;
	private ArrayList<Sprite> seperatorSprites;
	private Sprite backgroundSprite;
	private CustomLabel containerNameLabel;

	public ListContainer(String name, float width, float height) {
		super(width, height);
		this.listItems = new ArrayList<>();
		this.seperatorSprites = new ArrayList<>();

		this.backgroundSprite = TextureEnum.UI_GRAY.sprite();
		backgroundSprite.setSize(width, height);
		this.containerNameLabel = new CustomLabel(name);
		containerNameLabel.setSize(width, height);
		containerNameLabel.setAlignment(Align.center);

		Sprite topSeperator = TextureEnum.UI_BLACK.sprite();
		topSeperator.setSize(width, 1);
		seperatorSprites.add(topSeperator);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);
		containerNameLabel.draw(batch, parentAlpha);

		for (ListItem item : listItems) {
			item.draw(batch, parentAlpha);
		}

		for (Sprite sprite : seperatorSprites) {
			sprite.draw(batch);
		}
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		containerNameLabel.setPosition(x, y);

		// TODO: Set proper locations for seperatorSprites & listItems on setposition.
		float initY = y;
		int index = -1;
		for (Sprite sprite : seperatorSprites) {
			if (index < 0)
				sprite.setPosition(x, y);
			else {
				initY += listItems.get(index).height;
				sprite.setPosition(x, initY);
			}
			index++;
		}
	}

	@Override
	public float getHeight() {
		float height = this.height;

		for (ListItem item : listItems)
			height += item.getHeight();

		return height;
	}

	public void addItem(ListItem listItem) {
		listItem.setPosition(x, y - (listItems.size() * listItem.height) - listItem.height);
		listItems.add(listItem);

		Sprite seperatorSprite = TextureEnum.UI_BLACK.sprite();
		seperatorSprite.setPosition(x, y - ((listItems.size() - 1) * listItem.height) - listItem.height);
		seperatorSprite.setSize(width, 1);
		seperatorSprites.add(seperatorSprite);
	}

}
