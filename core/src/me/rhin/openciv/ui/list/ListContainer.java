package me.rhin.openciv.ui.list;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.label.CustomLabel;

public class ListContainer extends Group {

	public enum ListContainerType {
		CATEGORY, DEFAULT
	}

	private ContainerList containerList;
	private ArrayList<ListObject> itemListObjects;
	private Sprite topSeperatorSprite;
	private ListContainerType containerType;
	private Sprite categoryBackgroundSprite;
	private Sprite backgroundSprite;
	private CustomLabel containerNameLabel;

	public ListContainer(ContainerList containerList, ListContainerType containerType, String name) {
		this.setSize(containerList.getWidth(), (containerType == ListContainerType.CATEGORY ? 18 : 0));
		this.containerList = containerList;
		this.itemListObjects = new ArrayList<>();
		this.containerType = containerType;

		this.categoryBackgroundSprite = TextureEnum.UI_LIGHT_GRAY.sprite();
		categoryBackgroundSprite.setSize(getWidth(), getHeight());
		this.backgroundSprite = TextureEnum.UI_GRAY.sprite();
		backgroundSprite.setSize(getWidth(), getHeight());

		this.containerNameLabel = new CustomLabel(name);
		containerNameLabel.setSize(getWidth(), getHeight());
		containerNameLabel.setAlignment(Align.center);

		this.topSeperatorSprite = TextureEnum.UI_BLACK.sprite();
		topSeperatorSprite.setSize(getWidth(), 1);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);

		if (containerType == ListContainerType.CATEGORY) {
			categoryBackgroundSprite.draw(batch);
			containerNameLabel.draw(batch, parentAlpha);
		}

		topSeperatorSprite.draw(batch);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);

		categoryBackgroundSprite.setPosition(x, y + getHeight() - categoryBackgroundSprite.getHeight());
		backgroundSprite.setPosition(x, y);
		containerNameLabel.setPosition(x, y + getHeight() - containerNameLabel.getHeight());
		topSeperatorSprite.setPosition(x, y + getHeight() - (containerType == ListContainerType.CATEGORY ? 18 : 0));

		for (int i = 0; i < itemListObjects.size(); i++) {
			Actor itemActor = itemListObjects.get(i);
			// NOTE: This assumes that all listItems are the same size.
			itemActor.setPosition(0, (getHeight() - categoryBackgroundSprite.getHeight() - itemActor.getHeight())
					- (i * itemActor.getHeight()));
		}
	}

	public void addItem(ListObject listObject) {
		itemListObjects.add(listObject);
		addActor(listObject);

		// Update the height.
		// FIXME: If the itemActor exceeds the listContainer's height, we really
		// shouldn't increase the size further.
		setHeight(getHeight() + listObject.getHeight());
		updateHeight();
	}

	public void removeItem(String itemKey) {
		for (ListObject listObject : itemListObjects) {

			if (listObject.getKey().equals(itemKey)) {
				listObject.addAction(Actions.removeActor());
				itemListObjects.remove(listObject);

				setHeight(getHeight() - listObject.getHeight());
				updateHeight();

				break;
			}
		}
	}

	private void updateHeight() {
		backgroundSprite.setSize(getWidth(), getHeight());
	}

	public ArrayList<ListObject> getListItemActors() {
		return itemListObjects;
	}
}
