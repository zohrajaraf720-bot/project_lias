package ma.univh2c.fsbm.lias.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import ma.univh2c.fsbm.lias.entity.Document;

@Getter
@AllArgsConstructor
public class DocumentAjouteEvent {
    private final Document document;
}
