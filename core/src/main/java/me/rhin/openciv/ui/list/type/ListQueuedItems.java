package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.scenes.scene2d.InputEvent;

import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListObject;

public class ListQueuedItems extends ListObject {

	public ListQueuedItems(float width, float height, ContainerList containerList, String key) {
		super(width, height, containerList, key);
	}

	@Override
	protected void onClicked(InputEvent event) {
	}

}
