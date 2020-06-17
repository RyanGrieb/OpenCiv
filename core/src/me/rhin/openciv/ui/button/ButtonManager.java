package me.rhin.openciv.ui.button;

import java.util.ArrayList;

import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.MouseMoveListener;

public class ButtonManager {

	private ArrayList<Button> buttons;
	private Stage stage;

	public ButtonManager(Stage stage) {
		this.buttons = new ArrayList<>();
		this.stage = stage;
	}

	public void addButton(Button button) {
		button.addListener(new ClickListener() {
			@Override
			public void clicked(InputEvent event, float x, float y) {
				Button buttonActor = (Button) event.getListenerActor();
				buttonActor.onClick();
				event.handle();
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

		stage.addActor(button);
		buttons.add(button);
	}
}
