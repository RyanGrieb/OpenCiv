package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;
import java.util.Collections;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.listener.PickHeritageListener;
import me.rhin.openciv.listener.TopShapeRenderListener;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.game.HeritageLeaf;
import me.rhin.openciv.ui.game.TechnologyLeaf;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class HeritageWindow extends AbstractWindow implements TopShapeRenderListener, PickHeritageListener {

	// TODO: Sort by level
	private ArrayList<HeritageLeaf> heritageLeafs;
	private BlankBackground blankBackground;
	private CustomLabel heritageDescLabel;
	private CloseWindowButton closeWindowButton;

	public HeritageWindow() {
		super.setBounds(0, 0, viewport.getWorldWidth(), viewport.getWorldHeight());

		this.heritageLeafs = new ArrayList<>();

		this.blankBackground = new BlankBackground(0, 0, getWidth(), getHeight());
		addActor(blankBackground);

		this.heritageDescLabel = new CustomLabel(
				Civilization.getInstance().getGame().getPlayer().getCivilization().getName() + "'s Heritage",
				Align.center, 0, getHeight() - 25, getWidth(), 15);
		addActor(heritageDescLabel);

		Civilization.getInstance().getGame().getPlayer().unselectUnit();

		for (Heritage heritage : Civilization.getInstance().getGame().getPlayer().getHeritageTree().getAllHeritage()) {
			addHeritage(heritage);
		}

		this.closeWindowButton = new CloseWindowButton(this.getClass(), "Close", viewport.getWorldWidth() / 2 - 150 / 2,
				35, 150, 45);
		addActor(closeWindowButton);

		Civilization.getInstance().getEventManager().addListener(TopShapeRenderListener.class, this);
		Civilization.getInstance().getEventManager().addListener(PickHeritageListener.class, this);
	}

	@Override
	public void onTopShapeRender(ShapeRenderer shapeRenderer) {
		if (Civilization.getInstance().getWindowManager().isOpenWindow(PickHeritageWindow.class))
			return;

		// Get max level and draw lines on the way down
		int maxLevel = 0;
		for (HeritageLeaf leaf : heritageLeafs) {
			if (maxLevel < leaf.getHeritage().getLevel())
				maxLevel = leaf.getHeritage().getLevel();
		}

		for (int i = 0; i < maxLevel + 1; i++) {
			shapeRenderer.setColor(Color.WHITE);
			shapeRenderer.line(0, viewport.getWorldHeight() - 125 * (i + 1), viewport.getWorldWidth(),
					viewport.getWorldHeight() - 125 * (i + 1));
		}
	}

	@Override
	public void onPickHeritage(Heritage heritage) {
		for (HeritageLeaf leaf : heritageLeafs) {
			if (leaf.getHeritage().equals(heritage))
				leaf.setStudying(true);
			else
				leaf.setStudying(false);
		}
	}

	@Override
	public void onClose() {
		super.onClose();

		Civilization.getInstance().getEventManager().clearListenersFromObject(this);
	}

	@Override
	public boolean disablesInput() {
		return true;
	}

	@Override
	public boolean disablesCameraMovement() {
		return true;
	}

	@Override
	public boolean closesOtherWindows() {
		return true;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}

	private void addHeritage(Heritage heritage) {

		float width = 210;
		float height = 45;

		float x = 25;

		float y = getHeight() - height - 50;

		for (HeritageLeaf leaf : heritageLeafs) {
			if (leaf.getStage() != null) {
				removeActor(leaf);
				// actor.addAction(Actions.removeActor());
			}
		}

		HeritageLeaf heritageLeaf = new HeritageLeaf(heritage, x, y, width, height);
		heritageLeafs.add(heritageLeaf);
		Collections.sort(heritageLeafs);

		// Base position based off ourselfs and the previous leaf
		for (int i = 0; i < heritageLeafs.size(); i++) {
			HeritageLeaf leaf = heritageLeafs.get(i);
			HeritageLeaf prevLeaf = i < 1 ? null : heritageLeafs.get(i - 1);

			// If were on the same level as our prev leaf
			if (prevLeaf != null && prevLeaf.getHeritage().getLevel() == leaf.getHeritage().getLevel())
				x += 215;
			else if (prevLeaf != null && prevLeaf.getHeritage().getLevel() != leaf.getHeritage().getLevel()) {
				y -= 125;
				x = 25;
			}

			leaf.setPosition(x, y);
			addActor(leaf);
		}
	}
}
