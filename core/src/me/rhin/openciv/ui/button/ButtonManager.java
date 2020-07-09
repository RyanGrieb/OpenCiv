package me.rhin.openciv.ui.button;

import java.util.ArrayList;

import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.Civilization;

public class ButtonManager {

	private ArrayList<Button> buttons;
	private Stage stage;
	private Group group;

	// FIXME: This is a workaround, should be a single constructor.
	public ButtonManager(Stage stage) {
		this.buttons = new ArrayList<>();
		this.stage = stage;
	}

	// FIXME: This is a workaround, should be a single constructor.
	public ButtonManager(Group group) {
		this.buttons = new ArrayList<>();
		this.group = group;
	}

	public void addButton(Button button) {
		button.addListener(new ClickListener() {
			@Override
			public void clicked(InputEvent event, float x, float y) {
				if (!Civilization.getInstance().getWindowManager().allowsInput(event.getListenerActor())) {
					return;
				}
				Button buttonActor = (Button) event.getListenerActor();
				buttonActor.onClick();
			}

			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				Button buttonActor = (Button) event.getListenerActor();
				buttonActor.setHovered(true);
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				Button buttonActor = (Button) event.getListenerActor();
				buttonActor.setHovered(false);
			}
		});

		// FIXME: This is a workaround, should be a single variable.
		if (stage != null)
			stage.addActor(button);
		else if (group != null)
			group.addActor(button);

		buttons.add(button);
	}
}
