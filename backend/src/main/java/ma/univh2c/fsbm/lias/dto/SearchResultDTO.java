package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResultDTO {
    private List<MembreInterneDTO> membres;
    private List<DocumentDTO> documents;
    private List<EvenementDTO> evenements;
    private List<PublicationDTO> publications;
    private List<NotificationDTO> notifications;
}
