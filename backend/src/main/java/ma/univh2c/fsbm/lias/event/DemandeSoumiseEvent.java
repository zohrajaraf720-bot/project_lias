package ma.univh2c.fsbm.lias.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import ma.univh2c.fsbm.lias.entity.DemandeAdhesion;

@Getter
@AllArgsConstructor
public class DemandeSoumiseEvent {
    private final DemandeAdhesion demande;
}
