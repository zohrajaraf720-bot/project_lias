package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClotureMandatRequest {
    private LocalDate dateFin;
}
