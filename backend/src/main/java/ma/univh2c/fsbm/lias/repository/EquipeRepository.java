package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.Equipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipeRepository extends JpaRepository<Equipe, Long> {
    boolean existsByNomIgnoreCase(String nom);
    Optional<Equipe> findByNomIgnoreCase(String nom);
    List<Equipe> findByArchiveFalse();
}
