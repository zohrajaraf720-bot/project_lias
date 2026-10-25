package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.HistoriqueProfil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoriqueProfilRepository extends JpaRepository<HistoriqueProfil, Long> {
    List<HistoriqueProfil> findByMembreIdOrderByDateModificationDesc(Long membreId);
}
