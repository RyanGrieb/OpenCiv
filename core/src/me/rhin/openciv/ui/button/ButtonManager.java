package me.rhin.openciv.ui.button;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.LeftClickListener;
import me.rhin.openciv.listener.MouseMoveListener;
import me.rhin.openciv.ui.screen.AbstractScreen;

public class ButtonManager implements LeftClickListener, MouseMoveListener {

	private ArrayList<Button> buttons;
	private AbstractScreen screen;

	public ButtonManager(AbstractScreen screen) {
		this.buttons = new ArrayList<>();
		this.screen = screen;
		Civilization.getInstance().getEventManager().addListener(LeftClickListener.class, this);
		Civilization.getInstance().getEventManager().addListener(MouseMoveListener.class, this);
	}

	public void addButton(Button button) {
		// Civilization.getInstance().getEventManager().addListener(RenderListener.class,
		// button);
		screen.getStage().addActor(button);
		buttons.add(button);
	}

	@Override
	public void onLeftClick(float x, float y) {
		for (Button button : buttons) {
			if (x >= button.getX() && x < button.getX() + button.getWidth())
				if (y >= button.getY() && y <= button.getY() + button.getHeight())
					button.onClick();
		}
	}

	@Override
	public void onMouseMove(float x, float y) {
		for (Button button : buttons) {
			if (x >= button.getX() && x < button.getX() + button.getWidth())
				if (y >= button.getY() && y <= button.getY() + button.getHeight()) {
					button.setHovered(true);
					continue;
				}
			
			if(button.isHovered())
				button.setHovered(false);
		}
	}

}
