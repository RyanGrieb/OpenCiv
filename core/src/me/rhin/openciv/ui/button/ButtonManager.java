package me.rhin.openciv.ui.button;

import java.util.ArrayList;

import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.LeftClickListener;
import me.rhin.openciv.listener.MouseMoveListener;

public class ButtonManager implements MouseMoveListener {

	private ArrayList<Button> buttons;
	private Stage stage;

	public ButtonManager(Stage stage) {
		this.buttons = new ArrayList<>();
		this.stage = stage;
		Civilization.getInstance().getEventManager().addListener(MouseMoveListener.class, this);
	}

	public void addButton(Button button) {
		button.addListener(new ClickListener() {
			@Override
			public void clicked (InputEvent event, float x, float y) {
				Button buttonActor = (Button) event.getListenerActor();
				buttonActor.onClick();
				event.handle();
			}
		});

		stage.addActor(button);
		buttons.add(button);
	}

	/*
	 * @Override public void onLeftClick(float x, float y) { for (Button button :
	 * buttons) { if (x >= button.getX() && x < button.getX() + button.getWidth())
	 * if (y >= button.getY() && y <= button.getY() + button.getHeight())
	 * button.onClick(); } }
	 */

	@Override
	public void onMouseMove(float x, float y) {
		for (Button button : buttons) {
			if (x >= button.getX() && x < button.getX() + button.getWidth())
				if (y >= button.getY() && y <= button.getY() + button.getHeight()) {
					button.setHovered(true);
					continue;
				}

			if (button.isHovered())
				button.setHovered(false);
		}
	}

}
