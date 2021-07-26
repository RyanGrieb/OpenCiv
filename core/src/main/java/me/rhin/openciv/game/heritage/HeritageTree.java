package me.rhin.openciv.game.heritage;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import me.rhin.openciv.game.heritage.type.all.CapitalExpansionHeritage;
import me.rhin.openciv.game.heritage.type.all.StateWorshipHeritage;
import me.rhin.openciv.game.heritage.type.all.TaxesHeritage;

public class HeritageTree {

	private LinkedHashMap<Class<? extends Heritage>, Heritage> values;

	public HeritageTree() {
		this.values = new LinkedHashMap<>();

		// Our default heritage values
		addHeritage(new CapitalExpansionHeritage());
		addHeritage(new StateWorshipHeritage());
		addHeritage(new TaxesHeritage());
	}

	public void addHeritage(Heritage heritage) {
		values.put(heritage.getClass(), heritage);
	}

	public List<Heritage> getAllHeritage() {
		// FIXME: This seems dumb
		return new ArrayList<>(values.values());
	}

	public <T extends Heritage> boolean hasStudied(Class<T> heritageClass) {
		return values.get(heritageClass).isStudied();
	}

	public Heritage getHeritage(Class<? extends Heritage> clazz) {
		return values.get(clazz);
	}

	public Heritage getHeritageFromClassName(String className) {
		try {
			return values.get(Class.forName("me.rhin.openciv.game.heritage.type." + className));
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		}

		return null;
	}
}
