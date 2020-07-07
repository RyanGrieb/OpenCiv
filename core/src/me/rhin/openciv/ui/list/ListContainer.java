package me.rhin.openciv.ui.list;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.label.CustomLabel;

public class ListContainer extends ListItem {

	public enum ListContainerType {
		CATEGORY, DEFAULT
	}

	private ContainerList containerList;
	private ArrayList<ListItem> listItems;
	private ArrayList<Sprite> seperatorSprites;
	private ListContainerType containerType;
	private Sprite categoryBackgroundSprite;
	private Sprite backgroundSprite;
	private CustomLabel containerNameLabel;

	public ListContainer(ContainerList containerList, ListContainerType containerType, String name, float width) {
		super(width, (containerType == ListContainerType.CATEGORY ? 15 : 0));
		this.containerList = containerList;
		this.listItems = new ArrayList<>();
		this.seperatorSprites = new ArrayList<>();
		this.containerType = containerType;

		this.categoryBackgroundSprite = TextureEnum.UI_LIGHT_GRAY.sprite();
		categoryBackgroundSprite.setSize(width, height);
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
		// backgroundSprite.draw(batch);

		if (containerType == ListContainerType.CATEGORY) {
			categoryBackgroundSprite.draw(batch);
			containerNameLabel.draw(batch, parentAlpha);
		}

		for (ListItem item : listItems) {
			if (item.getY() >= containerList.getY())
				item.draw(batch, parentAlpha);
		}

		for (int i = 0; i < seperatorSprites.size(); i++) {
			Sprite sprite = seperatorSprites.get(i);

			// FIXME: The i > 0 doesn't account for non-rendered seperatorSprites.
			if (sprite.getY() >= containerList.getY() && i > 0)
				sprite.draw(batch);
		}
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		categoryBackgroundSprite.setPosition(x, y + height - categoryBackgroundSprite.getHeight());
		backgroundSprite.setPosition(x, y);
		containerNameLabel.setPosition(x, y + height - containerNameLabel.getHeight());

		for (int i = 0; i < listItems.size(); i++) {
			ListItem listItem = listItems.get(i);
			// NOTE: This assumes that all listItems are the same size.
			listItem.setPosition(x, y + (getHeight() - categoryBackgroundSprite.getHeight() - listItem.getHeight())
					- (i * listItem.getHeight()));
		}

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

	public void addItem(ListItem listItem) {
		// listItem.setPosition(x, y - (listItems.size() * listItem.height) -
		// listItem.height);
		listItems.add(listItem);

		Sprite seperatorSprite = TextureEnum.UI_BLACK.sprite();
		seperatorSprite.setSize(width, 1);
		seperatorSprites.add(seperatorSprite);

		// Update the height.
		// FIXME: If the listItem exceeds the listContainer's height, we really
		// shouldn't increase the size further.
		this.height += listItem.getHeight();
		updateHeight();
	}

	// TODO: We might make this a required method for all ListItem's.
	private void updateHeight() {
		backgroundSprite.setSize(width, height);
	}
}
