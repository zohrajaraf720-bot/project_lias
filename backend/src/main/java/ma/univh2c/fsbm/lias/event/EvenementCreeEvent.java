package ma.univh2c.fsbm.lias.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import ma.univh2c.fsbm.lias.entity.EvenementScientifique;

@Getter
@AllArgsConstructor
public class EvenementCreeEvent {
    private final EvenementScientifique evenement;
}
