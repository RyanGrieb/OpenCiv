package me.rhin.openciv.ui.list;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.label.CustomLabel;

public class ListContainer extends Group {

	public enum ListContainerType {
		CATEGORY, DEFAULT
	}

	private ContainerList containerList;
	private ArrayList<Group> listItemActors;
	private ArrayList<Sprite> seperatorSprites;
	private ListContainerType containerType;
	private Sprite categoryBackgroundSprite;
	private Sprite backgroundSprite;
	private CustomLabel containerNameLabel;

	public ListContainer(ContainerList containerList, ListContainerType containerType, String name) {
		this.setSize(containerList.getWidth(), (containerType == ListContainerType.CATEGORY ? 15 : 0));
		this.containerList = containerList;
		this.listItemActors = new ArrayList<>();
		this.seperatorSprites = new ArrayList<>();
		this.containerType = containerType;

		this.categoryBackgroundSprite = TextureEnum.UI_LIGHT_GRAY.sprite();
		categoryBackgroundSprite.setSize(getWidth(), getHeight());
		this.backgroundSprite = TextureEnum.UI_GRAY.sprite();
		backgroundSprite.setSize(getWidth(), getHeight());

		this.containerNameLabel = new CustomLabel(name);
		containerNameLabel.setSize(getWidth(), getHeight());
		containerNameLabel.setAlignment(Align.center);

		Sprite topSeperator = TextureEnum.UI_BLACK.sprite();
		topSeperator.setSize(getWidth(), 1);
		seperatorSprites.add(topSeperator);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		// backgroundSprite.draw(batch);

		if (containerType == ListContainerType.CATEGORY) {
			categoryBackgroundSprite.draw(batch);
			containerNameLabel.draw(batch, parentAlpha);
		}

		for (Actor itemActor : listItemActors) {
			// if (item.getY() >= containerList.getY())
			// itemActor.draw(batch, parentAlpha);
		}

		for (int i = 0; i < seperatorSprites.size(); i++) {
			Sprite sprite = seperatorSprites.get(i);

			// FIXME: The i > 0 doesn't account for non-rendered seperatorSprites.
			// if (sprite.getY() >= containerList.getY() && i > 0)
			sprite.draw(batch);
		}
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		
		categoryBackgroundSprite.setPosition(x, y + getHeight() - categoryBackgroundSprite.getHeight());
		backgroundSprite.setPosition(x, y);
		containerNameLabel.setPosition(x, y + getHeight() - containerNameLabel.getHeight());

		for (int i = 0; i < listItemActors.size(); i++) {
			Actor itemActor = listItemActors.get(i);
			// NOTE: This assumes that all listItems are the same size.
			itemActor.setPosition(0, (getHeight() - categoryBackgroundSprite.getHeight() - itemActor.getHeight())
					- (i * itemActor.getHeight()));
		}

		float initY = y;
		int index = -1;
		for (Sprite sprite : seperatorSprites) {
			if (index < 0)
				sprite.setPosition(x, y);
			else {
				initY += listItemActors.get(index).getHeight();
				sprite.setPosition(x, initY);
			}
			index++;
		}
	}

	public void addItem(Group itemGroup) {
		listItemActors.add(itemGroup);
		addActor(itemGroup);

		Sprite seperatorSprite = TextureEnum.UI_BLACK.sprite();
		seperatorSprite.setSize(getWidth(), 1);
		seperatorSprites.add(seperatorSprite);

		// Update the height.
		// FIXME: If the itemActor exceeds the listContainer's height, we really
		// shouldn't increase the size further.
		setHeight(getHeight() + itemGroup.getHeight());
		updateHeight();
	}

	private void updateHeight() {
		backgroundSprite.setSize(getWidth(), getHeight());
	}

	public ArrayList<Group> getListItemActors() {
		return listItemActors;
	}
}
