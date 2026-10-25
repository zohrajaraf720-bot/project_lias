package ma.univh2c.fsbm.lias.aspect;

import ma.univh2c.fsbm.lias.enums.TypeAction;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audite {
    TypeAction action();
    String entite();
}
