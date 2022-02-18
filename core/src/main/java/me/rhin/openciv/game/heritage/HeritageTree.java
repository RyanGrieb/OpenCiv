package me.rhin.openciv.game.heritage;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import com.badlogic.gdx.utils.reflect.ClassReflection;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.heritage.type.all.CapitalExpansionHeritage;
import me.rhin.openciv.game.heritage.type.all.StateWorshipHeritage;
import me.rhin.openciv.game.heritage.type.all.TaxesHeritage;
import me.rhin.openciv.listener.CompleteHeritageListener;
import me.rhin.openciv.listener.PickHeritageListener;
import me.rhin.openciv.shared.packet.type.CompleteHeritagePacket;
import me.rhin.openciv.ui.game.HeritageLineWeb;

public class HeritageTree implements CompleteHeritageListener, PickHeritageListener {

	private LinkedHashMap<Class<? extends Heritage>, Heritage> values;
	private Heritage studyingHeritage;

	public HeritageTree() {
		this.values = new LinkedHashMap<>();

		// Our default heritage values
		addHeritage(new CapitalExpansionHeritage());
		addHeritage(new StateWorshipHeritage());
		addHeritage(new TaxesHeritage());

		Civilization.getInstance().getEventManager().addListener(PickHeritageListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CompleteHeritageListener.class, this);
	}

	@Override
	public void onPickHeritage(Heritage heritage) {
		studyingHeritage = heritage;
	}

	@Override
	public void onCompleteHeritage(CompleteHeritagePacket packet) {
		studyingHeritage = null;
	}

	public void addHeritage(Heritage heritage) {
		values.put(heritage.getClass(), heritage);
	}

	public List<Heritage> getAllHeritage() {
		// FIXME: This seems dumb
		return new ArrayList<>(values.values());
	}

	public <T extends Heritage> boolean hasStudied(Class<T> heritageClass) {
		if (values.get(heritageClass) == null) {
			// LOGGER.info("Heritage not found: " + heritageClass);
			return false;
		}
		return values.get(heritageClass).isStudied();
	}

	public Heritage getHeritage(Class<? extends Heritage> clazz) {
		return values.get(clazz);
	}

	public Heritage getHeritageFromClassName(String className) {
		try {
			return values.get(ClassReflection.forName("me.rhin.openciv.game.heritage.type." + className));
		} catch (Exception e) {
			e.printStackTrace();
		}

		return null;
	}

	public boolean isStudying() {
		return studyingHeritage != null;
	}
}
