package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EtatCompteRequest {
    private String action; // ACTIVER, GELER, DESACTIVER
    private LocalDate date;
    private String motif;
}
