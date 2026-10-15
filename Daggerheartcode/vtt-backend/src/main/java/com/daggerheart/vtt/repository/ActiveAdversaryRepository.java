package com.daggerheart.vtt.repository;

import com.daggerheart.vtt.model.ActiveAdversary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActiveAdversaryRepository extends JpaRepository<ActiveAdversary, Long> {
    List<ActiveAdversary> findAllByOrderByIdAsc();
}
