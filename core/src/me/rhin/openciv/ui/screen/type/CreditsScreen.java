package me.rhin.openciv.ui.screen.type;

import java.util.ArrayList;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.button.ButtonManager;
import me.rhin.openciv.ui.button.type.BackTitleScreenButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.window.type.TitleOverlay;

public class CreditsScreen extends AbstractScreen {

	private EventManager eventManager;
	private TitleOverlay titleOverlay;
	private ButtonManager buttonManager;
	private ArrayList<CustomLabel> creditLabelList;

	public CreditsScreen() {
		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();

		this.titleOverlay = new TitleOverlay();
		stage.addActor(titleOverlay);

		this.buttonManager = new ButtonManager(getStage());

		creditLabelList = new ArrayList<>();
		creditLabelList.add(new CustomLabel(
				"Tiles:\n Basic Hex Tile Set - 16x16 by drjamgo \nhttps://opengameart.org/content/basic-hex-tile-set-16x16\n",
				Align.center, 0, viewport.getWorldHeight() - 100 - (creditLabelList.size() * 40),
				viewport.getWorldWidth(), 20));

		creditLabelList.add(new CustomLabel(
				"Basic Hex Tile Set Plus - 16x16 by pistachio \nhttps://opengameart.org/content/basic-hex-tile-set-plus-16x16\n",
				Align.center, 0, viewport.getWorldHeight() - 100 - (creditLabelList.size() * 40),
				viewport.getWorldWidth(), 20));

		creditLabelList
				.add(new CustomLabel("Icons: \n Roguelike/RPG Icons by Joe Williamson \n@JoeCreates\n", Align.center, 0,
						viewport.getWorldHeight() - 100 - (creditLabelList.size() * 40), viewport.getWorldWidth(), 20));

		creditLabelList.add(new CustomLabel(
				"\nUI: \n[LPC] Pennomi's UI Elements by pennomi, Buch, and cemkalyoncu \nhttps://opengameart.org/content/lpc-pennomis-ui-elements",
				Align.center, 0, viewport.getWorldHeight() - 100 - (creditLabelList.size() * 40),
				viewport.getWorldWidth(), 20));

		for (CustomLabel label : creditLabelList)
			stage.addActor(label);

		buttonManager.addButton(new BackTitleScreenButton(viewport.getWorldWidth() / 2 - 150 / 2, 50, 150, 45));

	}

	@Override
	public void render(float delta) {
		super.render(delta);

		Civilization.getInstance().getEventManager().fireEvent(MouseMoveEvent.INSTANCE);
	}

	@Override
	public boolean touchUp(int screenX, int screenY, int pointer, int button) {
		if (button == Input.Buttons.LEFT) {
			Civilization.getInstance().getEventManager().fireEvent(new LeftClickEvent(screenX, screenY));
		}
		return false;

	}
}
