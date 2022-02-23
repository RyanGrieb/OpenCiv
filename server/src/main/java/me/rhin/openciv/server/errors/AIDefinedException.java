package me.rhin.openciv.server.errors;

public class AIDefinedException extends Error {

	public AIDefinedException(Object object) {
		super(object + " already has an AI defined");
	}

}
